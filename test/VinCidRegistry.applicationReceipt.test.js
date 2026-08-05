import { expect } from "chai";
import { network } from "hardhat";
import { deployRegistryFixture } from "./fixtures.js";

const { ethers, networkHelpers } = await network.create();

function fixture() {
  return deployRegistryFixture(ethers);
}

describe("VinCidRegistry.submitApplication (ADR 0037)", function () {
  it("a wallet with no role at all can call it successfully", async function () {
    const { registry, other } = await networkHelpers.loadFixture(fixture);
    expect(await registry.hasRole(await registry.ORG_ROLE(), other.address)).to.equal(false);
    expect(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), other.address)).to.equal(
      false
    );

    await expect(registry.connect(other).submitApplication()).to.not.revert(ethers);
  });

  it("emits ApplicationSubmitted with the caller's address and the block timestamp", async function () {
    const { registry, other } = await networkHelpers.loadFixture(fixture);

    const tx = await registry.connect(other).submitApplication();
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    await expect(tx)
      .to.emit(registry, "ApplicationSubmitted")
      .withArgs(other.address, block.timestamp);
  });

  it("writes no storage — does not affect any VIN/CID state", async function () {
    const { registry, other } = await networkHelpers.loadFixture(fixture);
    await registry.connect(other).submitApplication();
    expect(await registry.getAllVins()).to.deep.equal([]);
  });

  it("reverts if called with nonzero ETH value (function is non-payable)", async function () {
    const { registry, other } = await networkHelpers.loadFixture(fixture);
    await expect(
      registry.connect(other).submitApplication({ value: ethers.parseEther("0.01") })
    ).to.revert(ethers);
  });

  it("allows the same wallet to call it more than once, each emitting its own event", async function () {
    const { registry, other } = await networkHelpers.loadFixture(fixture);

    await expect(registry.connect(other).submitApplication()).to.emit(
      registry,
      "ApplicationSubmitted"
    );
    await expect(registry.connect(other).submitApplication()).to.emit(
      registry,
      "ApplicationSubmitted"
    );
  });

  it("an ORG_ROLE holder can also call it (no access restriction either way)", async function () {
    const { registry, minter } = await networkHelpers.loadFixture(fixture);
    expect(await registry.hasRole(await registry.ORG_ROLE(), minter.address)).to.equal(true);
    await expect(registry.connect(minter).submitApplication()).to.not.revert(ethers);
  });
});
