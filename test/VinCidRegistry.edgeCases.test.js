import { expect } from "chai";
import { network } from "hardhat";
import { deployRegistryFixture } from "./fixtures.js";

const { ethers, networkHelpers } = await network.create();

describe("VinCidRegistry edge cases", function () {
  describe("withdrawToken — non-standard ERC-20 (no bool return)", function () {
    async function fixture() {
      const state = await deployRegistryFixture(ethers);
      const mock = await ethers.deployContract("NonStandardERC20Mock", [
        ethers.parseUnits("1000", 18),
      ]);
      await mock.transfer(state.registryAddress, ethers.parseUnits("100", 18));
      return { ...state, mock };
    }

    it("succeeds despite the token's transfer returning no boolean", async function () {
      const { registry, owner, other, mock } = await networkHelpers.loadFixture(fixture);
      const mockAddress = await mock.getAddress();
      const amount = ethers.parseUnits("100", 18);

      await expect(registry.connect(owner).withdrawToken(mockAddress, other.address, amount))
        .to.emit(registry, "TokensWithdrawn")
        .withArgs(mockAddress, other.address, amount);

      expect(await mock.balanceOf(other.address)).to.equal(amount);
    });
  });

  describe("reentrancy during the first mint", function () {
    async function fixture() {
      return deployRegistryFixture(ethers);
    }

    const VIN = "3VWFE21C04M000001"; // 17 chars
    const OUTER_CID = "outerCidWrittenByTheOriginalCall";
    const INNER_CID = "innerCidWrittenByTheReentrantCall";

    it("reverts the entire mint when the reentrant call comes from a wallet without ORG_ROLE (ADR 0035 narrows this hole, does not close it)", async function () {
      const { registry, registryAddress, minter } = await networkHelpers.loadFixture(fixture);
      const receiver = await ethers.deployContract("MaliciousReentrantReceiver");
      const receiverAddress = await receiver.getAddress();
      await receiver.arm(registryAddress, VIN, INNER_CID);

      // recipient is a contract, so _safeMint's internal _mint (which sets
      // ownership) runs, then onERC721Received fires *before* storeCid's own
      // _setTokenURI/_payReward — the receiver reenters storeCid for the
      // same VIN from inside that callback. See ADR 0020's Open Questions.
      //
      // Before ADR 0035, storeCid's update path was open to any caller, so
      // this reentrant call succeeded and left vinToCid/tokenURI diverging.
      // Now updates require ORG_ROLE, and the receiver contract (the
      // reentrant caller) doesn't hold it — its inner storeCid call reverts,
      // and that revert reason bubbles up through
      // ERC721Utils.checkOnERC721Received's catch block, failing the whole
      // outer mint instead of silently diverging. This narrows the hole
      // (an unprivileged reentrant recipient can no longer corrupt state) but
      // does not close it: an ORG_ROLE-holding contract acting as its own
      // recipient could still reenter and reproduce the divergence.
      await expect(
        registry.connect(minter).storeCid(VIN, OUTER_CID, receiverAddress, { gasLimit: 800_000n })
      ).to.be.revertedWith("Not an approved organization");
    });
  });
});
