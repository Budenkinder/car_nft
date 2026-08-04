import { expect } from "chai";
import { network } from "hardhat";
import { deployRegistryFixture } from "./fixtures.js";

const { ethers, networkHelpers } = await network.create();

const VIN_A = "1HGCM82633A004352"; // 17 chars
const CID_A = "bafybeigdyrztest0000000000000000000000000000000000000000a";
const CID_B = "bafybeigdyrztest0000000000000000000000000000000000000000b";
const MINT_GAS_LIMIT = 500_000n;

function fixture() {
  return deployRegistryFixture(ethers);
}

async function mintedFixture() {
  const state = await deployRegistryFixture(ethers);
  await state.registry
    .connect(state.minter)
    .storeCid(VIN_A, CID_A, state.recipient.address, { gasLimit: MINT_GAS_LIMIT });
  return state;
}

describe("VinCidRegistry roles (ADR 0035)", function () {
  describe("ORG_ROLE gating", function () {
    it("the incumbent minter retains ORG_ROLE post-migration and can mint", async function () {
      const { registry, minter, recipient } = await networkHelpers.loadFixture(fixture);
      expect(await registry.hasRole(await registry.ORG_ROLE(), minter.address)).to.equal(true);
      await expect(
        registry.connect(minter).storeCid(VIN_A, CID_A, recipient.address, { gasLimit: MINT_GAS_LIMIT })
      ).to.not.revert(ethers);
    });

    it("a non-org wallet cannot mint", async function () {
      const { registry, other, recipient } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(other).storeCid(VIN_A, CID_A, recipient.address)
      ).to.be.revertedWith("Not an approved organization");
    });

    it("a non-org wallet cannot update an existing VIN", async function () {
      const { registry, other } = await networkHelpers.loadFixture(mintedFixture);
      await expect(
        registry.connect(other).storeCid(VIN_A, CID_B, ethers.ZeroAddress)
      ).to.be.revertedWith("Not an approved organization");
    });

    it("an ORG_ROLE wallet can both mint and update", async function () {
      const { registry, owner, other, recipient } = await networkHelpers.loadFixture(fixture);
      await registry.connect(owner).grantRole(await registry.ORG_ROLE(), other.address);

      await expect(
        registry.connect(other).storeCid(VIN_A, CID_A, recipient.address, { gasLimit: MINT_GAS_LIMIT })
      ).to.not.revert(ethers);
      await expect(
        registry.connect(other).storeCid(VIN_A, CID_B, ethers.ZeroAddress)
      ).to.not.revert(ethers);
      expect(await registry.getCidByVin(VIN_A)).to.equal(CID_B);
    });
  });

  describe("DEFAULT_ADMIN_ROLE grant/revoke", function () {
    it("reverts when a non-admin tries to grantRole", async function () {
      const { registry, other, recipient } = await networkHelpers.loadFixture(fixture);
      const orgRole = await registry.ORG_ROLE();
      await expect(registry.connect(other).grantRole(orgRole, recipient.address))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(other.address, await registry.DEFAULT_ADMIN_ROLE());
    });

    it("the deployer-admin can grant ORG_ROLE to an arbitrary wallet", async function () {
      const { registry, owner, other } = await networkHelpers.loadFixture(fixture);
      const orgRole = await registry.ORG_ROLE();
      expect(await registry.hasRole(orgRole, other.address)).to.equal(false);

      await registry.connect(owner).grantRole(orgRole, other.address);
      expect(await registry.hasRole(orgRole, other.address)).to.equal(true);
    });

    it("a revoked org loses both mint and update abilities", async function () {
      const { registry, owner, minter, recipient } = await networkHelpers.loadFixture(mintedFixture);
      const orgRole = await registry.ORG_ROLE();
      expect(await registry.hasRole(orgRole, minter.address)).to.equal(true);

      await registry.connect(owner).revokeRole(orgRole, minter.address);
      expect(await registry.hasRole(orgRole, minter.address)).to.equal(false);

      await expect(
        registry.connect(minter).storeCid(VIN_A, CID_B, ethers.ZeroAddress)
      ).to.be.revertedWith("Not an approved organization");
      await expect(
        registry
          .connect(minter)
          .storeCid("2FTRX18W1XCA00000", CID_A, recipient.address, { gasLimit: MINT_GAS_LIMIT })
      ).to.be.revertedWith("Not an approved organization");
    });
  });

  describe("initializeV2", function () {
    it("cannot be called a second time", async function () {
      const { registry, owner } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(owner).initializeV2(owner.address)
      ).to.be.revertedWithCustomError(registry, "InvalidInitialization");
    });

    it("reverts when the admin address is the zero address", async function () {
      const [, minter] = await ethers.getSigners();
      const token = await ethers.deployContract("CarRewardToken");
      const tokenAddress = await token.getAddress();

      const Registry = await ethers.getContractFactory("VinCidRegistry");
      const implementation = await Registry.deploy();
      await implementation.waitForDeployment();
      const initData = Registry.interface.encodeFunctionData("initialize", [
        tokenAddress,
        minter.address,
      ]);
      const Proxy = await ethers.getContractFactory("ERC1967Proxy");
      const proxy = await Proxy.deploy(await implementation.getAddress(), initData);
      await proxy.waitForDeployment();
      const registry = Registry.attach(await proxy.getAddress());

      await expect(registry.initializeV2(ethers.ZeroAddress)).to.be.revertedWith("Admin required");
    });
  });
});
