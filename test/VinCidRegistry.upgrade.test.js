import { expect } from "chai";
import { network } from "hardhat";
import { deployRegistryFixture } from "./fixtures.js";

const { ethers, networkHelpers } = await network.create();

const VIN_A = "1HGCM82633A004352"; // 17 chars
const VIN_B = "2FTRX18W1XCA00000"; // 17 chars
const CID_A = "bafybeigdyrztest0000000000000000000000000000000000000000a";
const CID_B = "bafybeigdyrztest0000000000000000000000000000000000000000b";
const MINT_GAS_LIMIT = 500_000n;

function fixture() {
  return deployRegistryFixture(ethers);
}

// Mirrors fixtures.js's deployRegistryProxy, but for the frozen V1 mock
// factory — used only to prove the ADR 0035 migration preserves state.
async function deployV1MockProxy(tokenAddress, initialMinter) {
  const V1 = await ethers.getContractFactory("VinCidRegistryV1Mock");
  const implementation = await V1.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();

  const initData = V1.interface.encodeFunctionData("initialize", [tokenAddress, initialMinter]);
  const Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await Proxy.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();

  return { registry: V1.attach(await proxy.getAddress()), registryAddress: await proxy.getAddress() };
}

// Deploys the pre-ADR-0035 registry (single `minter` EOA, no AccessControl,
// open updates) and registers one real VIN against it, so the migration test
// below has genuine pre-upgrade state to assert survives.
async function preAdr0035Fixture() {
  const [owner, minter, recipient, other] = await ethers.getSigners();
  const token = await ethers.deployContract("CarRewardToken");
  const tokenAddress = await token.getAddress();

  const { registry, registryAddress } = await deployV1MockProxy(tokenAddress, minter.address);

  const rewardAmount = ethers.parseUnits("10", 18);
  const rewardPool = ethers.parseUnits("1000000", 18);
  await token.transfer(registryAddress, rewardPool);
  await registry.setRewardAmount(rewardAmount);
  await registry
    .connect(minter)
    .storeCid(VIN_A, CID_A, recipient.address, { gasLimit: MINT_GAS_LIMIT });

  return { token, registry, registryAddress, owner, minter, recipient, other, rewardAmount };
}

// Registers two VINs against the proxy so the upgrade test has real
// pre-upgrade state (mappings, array, reward config) to assert survives.
async function registeredFixture() {
  const state = await deployRegistryFixture(ethers);
  await state.registry
    .connect(state.minter)
    .storeCid(VIN_A, CID_A, state.recipient.address, { gasLimit: MINT_GAS_LIMIT });
  await state.registry
    .connect(state.minter)
    .storeCid(VIN_B, CID_B, state.other.address, { gasLimit: MINT_GAS_LIMIT });
  return state;
}

describe("VinCidRegistry upgrade (UUPS proxy)", function () {
  it("preserves registered VINs/CIDs, reward config, and minter across an upgrade", async function () {
    const { registry, registryAddress, owner, minter, recipient, other, rewardAmount } =
      await networkHelpers.loadFixture(registeredFixture);

    const V2 = await ethers.getContractFactory("VinCidRegistryV2Mock");
    const v2Impl = await V2.deploy();
    await v2Impl.waitForDeployment();
    const v2ImplAddress = await v2Impl.getAddress();

    await (await registry.connect(owner).upgradeToAndCall(v2ImplAddress, "0x")).wait();

    const upgraded = V2.attach(registryAddress);

    // Pre-upgrade state survives untouched.
    expect(await upgraded.getAllVins()).to.deep.equal([VIN_A, VIN_B]);
    expect(await upgraded.getAllCidsAsList()).to.deep.equal([CID_A, CID_B]);
    expect(await upgraded.getCidByVin(VIN_A)).to.equal(CID_A);
    expect(await upgraded.getCidByVin(VIN_B)).to.equal(CID_B);
    expect(await upgraded.rewardAmount()).to.equal(rewardAmount);
    expect(await upgraded.minter()).to.equal(minter.address);
    expect(await upgraded.ownerOf(tokenIdFor(VIN_A))).to.equal(recipient.address);
    expect(await upgraded.ownerOf(tokenIdFor(VIN_B))).to.equal(other.address);

    // New field is available and starts empty — not corrupted with old data.
    expect(await upgraded.newFeatureFlag()).to.equal("");
    expect(await upgraded.versionTag()).to.equal("v2-mock");

    await upgraded.connect(owner).setNewFeatureFlag("enabled");
    expect(await upgraded.newFeatureFlag()).to.equal("enabled");

    // storeCid still works post-upgrade (inherited, unchanged logic).
    const CID_A_UPDATED = "bafybeigdyrztest0000000000000000000000000000000000000000c";
    await upgraded.connect(other).storeCid(VIN_A, CID_A_UPDATED, ethers.ZeroAddress);
    expect(await upgraded.getCidByVin(VIN_A)).to.equal(CID_A_UPDATED);
  });

  it("reverts when a non-owner calls upgradeToAndCall", async function () {
    const { registry, other } = await networkHelpers.loadFixture(fixture);

    const V2 = await ethers.getContractFactory("VinCidRegistryV2Mock");
    const v2Impl = await V2.deploy();
    await v2Impl.waitForDeployment();
    const v2ImplAddress = await v2Impl.getAddress();

    await expect(registry.connect(other).upgradeToAndCall(v2ImplAddress, "0x"))
      .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("the proxy address is unchanged by an upgrade", async function () {
    const { registry, registryAddress, owner } = await networkHelpers.loadFixture(fixture);

    const V2 = await ethers.getContractFactory("VinCidRegistryV2Mock");
    const v2Impl = await V2.deploy();
    await v2Impl.waitForDeployment();

    await (await registry.connect(owner).upgradeToAndCall(await v2Impl.getAddress(), "0x")).wait();

    expect(await registry.getAddress()).to.equal(registryAddress);
  });
});

// ADR 0035: proves the real migration — deploys the actual pre-ADR-0035
// contract (not a hypothetical mock), upgrades to the current
// ORG_ROLE-gated VinCidRegistry, and checks that AccessControlUpgradeable's
// ERC-7201 namespaced storage does not collide with the sequential slots or
// __gap this contract already relies on.
describe("VinCidRegistry ADR 0035 migration (pre-ORG_ROLE -> ORG_ROLE)", function () {
  it("preserves all pre-upgrade state byte-for-byte and bootstraps roles via initializeV2", async function () {
    const { registry, registryAddress, owner, minter, recipient, other, rewardAmount } =
      await networkHelpers.loadFixture(preAdr0035Fixture);

    const Registry = await ethers.getContractFactory("VinCidRegistry");
    const impl = await Registry.deploy();
    await impl.waitForDeployment();
    await (await registry.connect(owner).upgradeToAndCall(await impl.getAddress(), "0x")).wait();

    const upgraded = Registry.attach(registryAddress);

    // Pre-upgrade state survives untouched.
    expect(await upgraded.getAllVins()).to.deep.equal([VIN_A]);
    expect(await upgraded.getCidByVin(VIN_A)).to.equal(CID_A);
    expect(await upgraded.rewardAmount()).to.equal(rewardAmount);
    expect(await upgraded.minter()).to.equal(minter.address); // deprecated, still readable
    expect(await upgraded.ownerOf(tokenIdFor(VIN_A))).to.equal(recipient.address);

    // Before initializeV2 runs, nobody holds ORG_ROLE yet — not even the
    // incumbent minter — so storeCid must revert for everyone. This proves
    // the new gate is live immediately on upgrade, with no window where the
    // old "only minter can mint, updates open" behavior lingers.
    await expect(
      upgraded.connect(minter).storeCid(VIN_A, CID_A, ethers.ZeroAddress)
    ).to.be.revertedWith("Not an approved organization");

    await upgraded.connect(owner).initializeV2(owner.address);

    expect(await upgraded.hasRole(await upgraded.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(
      true
    );
    expect(await upgraded.hasRole(await upgraded.ORG_ROLE(), minter.address)).to.equal(true);
    expect(await upgraded.hasRole(await upgraded.ORG_ROLE(), other.address)).to.equal(false);

    // The incumbent minter keeps working post-migration...
    const CID_A_UPDATED = "bafybeigdyrztest0000000000000000000000000000000000000000c";
    await upgraded.connect(minter).storeCid(VIN_A, CID_A_UPDATED, ethers.ZeroAddress);
    expect(await upgraded.getCidByVin(VIN_A)).to.equal(CID_A_UPDATED);

    // ...and a non-org wallet still cannot update — the vulnerability this
    // ADR closes (updates were previously open to anyone).
    await expect(
      upgraded.connect(other).storeCid(VIN_A, CID_A, ethers.ZeroAddress)
    ).to.be.revertedWith("Not an approved organization");

    // initializeV2 cannot run twice.
    await expect(
      upgraded.connect(owner).initializeV2(owner.address)
    ).to.be.revertedWithCustomError(upgraded, "InvalidInitialization");
  });
});

function tokenIdFor(vin) {
  return BigInt(ethers.keccak256(ethers.toUtf8Bytes(vin)));
}
