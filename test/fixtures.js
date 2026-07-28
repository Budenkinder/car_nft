// Shared deployment fixture for VinCidRegistry/CarRewardToken tests. Takes
// `ethers` from the calling test file's own `network.create()` connection so
// `networkHelpers.loadFixture` snapshots the same chain instance the test
// asserts against.
export async function deployRegistryFixture(ethers) {
  const [owner, minter, recipient, other] = await ethers.getSigners();

  const token = await ethers.deployContract("CarRewardToken");
  const tokenAddress = await token.getAddress();

  const registry = await ethers.deployContract("VinCidRegistry", [
    tokenAddress,
    minter.address,
  ]);
  const registryAddress = await registry.getAddress();

  const rewardAmount = ethers.parseUnits("10", 18);
  const rewardPool = ethers.parseUnits("1000000", 18);
  await token.transfer(registryAddress, rewardPool);
  await registry.setRewardAmount(rewardAmount);

  return {
    token,
    registry,
    tokenAddress,
    registryAddress,
    owner,
    minter,
    recipient,
    other,
    rewardAmount,
    rewardPool,
  };
}
