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

    it("leaves vinToCid and the NFT's tokenURI pointing at different CIDs — documented, not fixed", async function () {
      const { registry, registryAddress, minter } = await networkHelpers.loadFixture(fixture);
      const receiver = await ethers.deployContract("MaliciousReentrantReceiver");
      const receiverAddress = await receiver.getAddress();
      await receiver.arm(registryAddress, VIN, INNER_CID);

      // recipient is a contract, so _safeMint's internal _mint (which sets
      // ownership) runs, then onERC721Received fires *before* storeCid's own
      // _setTokenURI/_payReward — the receiver reenters storeCid for the
      // same VIN from inside that callback. See ADR 0020's Open Questions.
      await registry
        .connect(minter)
        .storeCid(VIN, OUTER_CID, receiverAddress, { gasLimit: 800_000n });

      const tokenId = BigInt(ethers.keccak256(ethers.toUtf8Bytes(VIN)));

      // The outer call's _setTokenURI runs *after* the reentrant inner call
      // returns, clobbering it — tokenURI ends up reflecting the outer
      // (original) CID, while vinToCid (read via getCidByVin) reflects the
      // inner (reentrant) CID written during the callback.
      expect(await registry.tokenURI(tokenId)).to.equal(`ipfs://${OUTER_CID}`);
      expect(await registry.getCidByVin(VIN)).to.equal(INNER_CID);
      expect(await registry.ownerOf(tokenId)).to.equal(receiverAddress); // exactly one NFT minted
    });
  });
});
