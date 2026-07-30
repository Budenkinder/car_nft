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

function tokenIdFor(vin) {
  return BigInt(ethers.keccak256(ethers.toUtf8Bytes(vin)));
}
