import { expect } from "chai";
import { network } from "hardhat";
import { deployRegistryFixture } from "./fixtures.js";

const { ethers, networkHelpers } = await network.create();

const VIN_A = "1HGCM82633A004352"; // 17 chars
const VIN_B = "2FTRX18W1XCA00000"; // 17 chars
const CID_A = "bafybeigdyrztest0000000000000000000000000000000000000000a";
const CID_B = "bafybeigdyrztest0000000000000000000000000000000000000000b";

// storeCid's reward payout happens inside a `try/catch` around an inner
// `rewardToken.transfer` call. `eth_estimateGas`'s binary search only looks
// for "enough gas that the outer call doesn't revert" — since the try/catch
// swallows an out-of-gas inner transfer without reverting the outer call,
// the *default* estimate can land exactly on "mint succeeds, reward silently
// doesn't." Tests that need the reward to land deterministically pass an
// explicit, generous override; see the dedicated test below that documents
// the failure mode itself.
const MINT_GAS_LIMIT = 500_000n;

function fixture() {
  return deployRegistryFixture(ethers);
}

function tokenIdFor(vin) {
  return BigInt(ethers.keccak256(ethers.toUtf8Bytes(vin)));
}

describe("VinCidRegistry", function () {
  describe("constructor", function () {
    it("reverts when initialMinter is the zero address", async function () {
      const { tokenAddress } = await networkHelpers.loadFixture(fixture);
      const Registry = await ethers.getContractFactory("VinCidRegistry");
      await expect(
        Registry.deploy(tokenAddress, ethers.ZeroAddress)
      ).to.be.revertedWith("Minter required");
    });

    it("sets the minter and emits MinterChanged on deploy", async function () {
      const { tokenAddress, minter } = await networkHelpers.loadFixture(fixture);
      const Registry = await ethers.getContractFactory("VinCidRegistry");
      const registry = await Registry.deploy(tokenAddress, minter.address);
      await expect(registry.deploymentTransaction())
        .to.emit(registry, "MinterChanged")
        .withArgs(ethers.ZeroAddress, minter.address);
      expect(await registry.minter()).to.equal(minter.address);
    });
  });

  describe("storeCid — new mint", function () {
    it("mints the NFT to recipient, sets tokenURI, emits CidStored, and pays the reward", async function () {
      const { registry, token, minter, recipient, rewardAmount } =
        await networkHelpers.loadFixture(fixture);
      const tokenId = tokenIdFor(VIN_A);

      await expect(
        registry
          .connect(minter)
          .storeCid(VIN_A, CID_A, recipient.address, { gasLimit: MINT_GAS_LIMIT })
      )
        .to.emit(registry, "CidStored")
        .withArgs(VIN_A, CID_A, tokenId);

      expect(await registry.ownerOf(tokenId)).to.equal(recipient.address);
      expect(await registry.tokenURI(tokenId)).to.equal(`ipfs://${CID_A}`);
      expect(await registry.getCidByVin(VIN_A)).to.equal(CID_A);
      expect(await registry.getAllVins()).to.deep.equal([VIN_A]);
      expect(await token.balanceOf(recipient.address)).to.equal(rewardAmount);
    });

    it("reverts when the VIN is not 17 characters", async function () {
      const { registry, minter, recipient } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(minter).storeCid("SHORTVIN", CID_A, recipient.address)
      ).to.be.revertedWith("VIN must be 17 characters");
    });

    it("reverts when the CID is empty", async function () {
      const { registry, minter, recipient } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(minter).storeCid(VIN_A, "", recipient.address)
      ).to.be.revertedWith("CID required");
    });

    it("reverts when called by anyone other than the minter", async function () {
      const { registry, other, recipient } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(other).storeCid(VIN_A, CID_A, recipient.address)
      ).to.be.revertedWith("Only minter can mint");
    });

    it("reverts when recipient is the zero address", async function () {
      const { registry, minter } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(minter).storeCid(VIN_A, CID_A, ethers.ZeroAddress)
      ).to.be.revertedWith("Recipient required");
    });
  });

  describe("storeCid — update", function () {
    async function mintedFixture() {
      const state = await deployRegistryFixture(ethers);
      await state.registry
        .connect(state.minter)
        .storeCid(VIN_A, CID_A, state.recipient.address, { gasLimit: MINT_GAS_LIMIT });
      return state;
    }

    it("allows any caller to update the CID without minting a new token or paying a reward again", async function () {
      const { registry, token, other, recipient, rewardAmount } =
        await networkHelpers.loadFixture(mintedFixture);
      const tokenId = tokenIdFor(VIN_A);
      const balanceBefore = await token.balanceOf(recipient.address);
      expect(balanceBefore).to.equal(rewardAmount);

      await expect(registry.connect(other).storeCid(VIN_A, CID_B, ethers.ZeroAddress))
        .to.emit(registry, "CidStored")
        .withArgs(VIN_A, CID_B, tokenId);

      expect(await registry.tokenURI(tokenId)).to.equal(`ipfs://${CID_B}`);
      expect(await registry.getCidByVin(VIN_A)).to.equal(CID_B);
      expect(await registry.ownerOf(tokenId)).to.equal(recipient.address); // unchanged
      expect(await registry.getAllVins()).to.deep.equal([VIN_A]); // no duplicate entry
      expect(await token.balanceOf(recipient.address)).to.equal(balanceBefore); // no second reward
    });
  });

  describe("admin: setMinter", function () {
    it("reverts for a non-owner caller", async function () {
      const { registry, other } = await networkHelpers.loadFixture(fixture);
      await expect(registry.connect(other).setMinter(other.address))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
        .withArgs(other.address);
    });

    it("reverts when the new minter is the zero address", async function () {
      const { registry, owner } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(owner).setMinter(ethers.ZeroAddress)
      ).to.be.revertedWith("Minter required");
    });

    it("emits MinterChanged and updates minter() on success", async function () {
      const { registry, owner, minter, other } = await networkHelpers.loadFixture(fixture);
      await expect(registry.connect(owner).setMinter(other.address))
        .to.emit(registry, "MinterChanged")
        .withArgs(minter.address, other.address);
      expect(await registry.minter()).to.equal(other.address);
    });
  });

  describe("admin: setRewardToken / setRewardAmount", function () {
    it("setRewardToken reverts for non-owner and updates rewardToken() on success", async function () {
      const { registry, owner, other, tokenAddress } = await networkHelpers.loadFixture(fixture);
      await expect(registry.connect(other).setRewardToken(other.address))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
        .withArgs(other.address);

      await registry.connect(owner).setRewardToken(other.address);
      expect(await registry.rewardToken()).to.equal(other.address);
      expect(tokenAddress).to.not.equal(other.address); // sanity: actually changed
    });

    it("setRewardAmount reverts for non-owner and updates rewardAmount() on success", async function () {
      const { registry, owner, other } = await networkHelpers.loadFixture(fixture);
      await expect(registry.connect(other).setRewardAmount(1n))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
        .withArgs(other.address);

      const newAmount = ethers.parseUnits("42", 18);
      await registry.connect(owner).setRewardAmount(newAmount);
      expect(await registry.rewardAmount()).to.equal(newAmount);
    });
  });

  describe("admin: withdrawToken", function () {
    it("reverts for a non-owner caller", async function () {
      const { registry, other, tokenAddress } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(other).withdrawToken(tokenAddress, other.address, 1n)
      )
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
        .withArgs(other.address);
    });

    it("reverts when `to` is the zero address", async function () {
      const { registry, owner, tokenAddress } = await networkHelpers.loadFixture(fixture);
      await expect(
        registry.connect(owner).withdrawToken(tokenAddress, ethers.ZeroAddress, 1n)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("transfers the registry's balance and emits TokensWithdrawn", async function () {
      const { registry, registryAddress, token, tokenAddress, owner, other, rewardPool } =
        await networkHelpers.loadFixture(fixture);
      const registryBalance = await token.balanceOf(registryAddress);
      expect(registryBalance).to.equal(rewardPool);

      await expect(
        registry.connect(owner).withdrawToken(tokenAddress, other.address, registryBalance)
      )
        .to.emit(registry, "TokensWithdrawn")
        .withArgs(tokenAddress, other.address, registryBalance);

      expect(await token.balanceOf(other.address)).to.equal(registryBalance);
      expect(await token.balanceOf(registryAddress)).to.equal(0n);
    });
  });

  describe("reward payout edge case", function () {
    it("mint still succeeds when the registry holds no reward tokens", async function () {
      const { registry, token, owner, minter, recipient, registryAddress } =
        await networkHelpers.loadFixture(fixture);

      // Drain the registry's CRT balance so _payReward's transfer must fail.
      const balance = await token.balanceOf(registryAddress);
      await registry.connect(owner).withdrawToken(
        await token.getAddress(),
        owner.address,
        balance
      );
      expect(await token.balanceOf(registryAddress)).to.equal(0n);

      const tokenId = tokenIdFor(VIN_A);
      await expect(
        registry
          .connect(minter)
          .storeCid(VIN_A, CID_A, recipient.address, { gasLimit: MINT_GAS_LIMIT })
      ).to.not.revert(ethers);

      expect(await registry.ownerOf(tokenId)).to.equal(recipient.address);
      expect(await token.balanceOf(recipient.address)).to.equal(0n); // reward silently failed
    });

    it("documents that default gas estimation can silently skip the reward despite a funded registry", async function () {
      // Unlike the test above (registry genuinely has nothing to pay), this
      // one funds the registry normally and lets ethers auto-estimate gas
      // for the mint (no override) — reproducing what a wallet's default gas
      // estimation would do. The outer call succeeds either way (the
      // try/catch guarantees that); whether the reward *actually* lands
      // depends on gas headroom the estimator has no reason to provide,
      // since it only searches for "outer call doesn't revert."
      const { registry, token, minter, recipient } = await networkHelpers.loadFixture(fixture);
      const tokenId = tokenIdFor(VIN_A);

      await registry.connect(minter).storeCid(VIN_A, CID_A, recipient.address); // no gasLimit override

      expect(await registry.ownerOf(tokenId)).to.equal(recipient.address); // mint still "succeeded"
      expect(await token.balanceOf(recipient.address)).to.equal(0n); // reward silently didn't land
    });
  });

  describe("view functions", function () {
    it("getAllVins/getAllCidsAsList are empty on a fresh registry", async function () {
      const { registry } = await networkHelpers.loadFixture(fixture);
      expect(await registry.getAllVins()).to.deep.equal([]);
      expect(await registry.getAllCidsAsList()).to.deep.equal([]);
    });

    it("keep VIN/CID lists parallel and ordered across multiple mints", async function () {
      const { registry, minter, recipient } = await networkHelpers.loadFixture(fixture);
      await registry.connect(minter).storeCid(VIN_A, CID_A, recipient.address);
      await registry.connect(minter).storeCid(VIN_B, CID_B, recipient.address);

      expect(await registry.getAllVins()).to.deep.equal([VIN_A, VIN_B]);
      expect(await registry.getAllCidsAsList()).to.deep.equal([CID_A, CID_B]);
    });
  });
});
