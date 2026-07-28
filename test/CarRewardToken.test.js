import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

async function deployTokenFixture() {
  const [owner, other] = await ethers.getSigners();
  const token = await ethers.deployContract("CarRewardToken");
  return { token, owner, other };
}

describe("CarRewardToken", function () {
  describe("constructor", function () {
    it("sets name, symbol, and decimals", async function () {
      const { token } = await networkHelpers.loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("CarRewardToken");
      expect(await token.symbol()).to.equal("CRT");
      expect(await token.decimals()).to.equal(18);
    });

    it("mints the full initial supply to the deployer", async function () {
      const { token, owner } = await networkHelpers.loadFixture(deployTokenFixture);
      const expectedSupply = ethers.parseUnits("1000000000", 18);
      expect(await token.totalSupply()).to.equal(expectedSupply);
      expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("sets the deployer as owner", async function () {
      const { token, owner } = await networkHelpers.loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("mint", function () {
    it("reverts for a non-owner caller", async function () {
      const { token, other } = await networkHelpers.loadFixture(deployTokenFixture);
      await expect(token.connect(other).mint(other.address, 1n))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(other.address);
    });

    it("increases balance and total supply when called by the owner", async function () {
      const { token, owner, other } = await networkHelpers.loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("500", 18);
      const supplyBefore = await token.totalSupply();

      await token.connect(owner).mint(other.address, amount);

      expect(await token.balanceOf(other.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(supplyBefore + amount);
    });
  });
});
