// Deploys VinCidRegistry as an implementation contract behind a fresh
// ERC1967Proxy, calling `initialize(rewardTokenAddress, initialMinter)` as
// the proxy's constructor calldata — mirrors scripts/deploy.js's bootstrap
// path (see ADR 0028). Returns an ethers contract instance attached to the
// *proxy* address using the implementation's interface, so callers interact
// with it exactly as the frontend/production callers do.
export async function deployRegistryProxy(ethers, tokenAddress, initialMinter) {
  const Registry = await ethers.getContractFactory("VinCidRegistry");
  const implementation = await Registry.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();

  const initData = Registry.interface.encodeFunctionData("initialize", [
    tokenAddress,
    initialMinter,
  ]);
  const Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await Proxy.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  return {
    registry: Registry.attach(proxyAddress),
    registryAddress: proxyAddress,
    implementationAddress,
    Registry,
    proxyDeploymentTransaction: proxy.deploymentTransaction(),
  };
}

// Shared deployment fixture for VinCidRegistry/CarRewardToken tests. Takes
// `ethers` from the calling test file's own `network.create()` connection so
// `networkHelpers.loadFixture` snapshots the same chain instance the test
// asserts against.
export async function deployRegistryFixture(ethers) {
  const [owner, minter, recipient, other] = await ethers.getSigners();

  const token = await ethers.deployContract("CarRewardToken");
  const tokenAddress = await token.getAddress();

  const { registry, registryAddress, implementationAddress, Registry } =
    await deployRegistryProxy(ethers, tokenAddress, minter.address);

  const rewardAmount = ethers.parseUnits("10", 18);
  const rewardPool = ethers.parseUnits("1000000", 18);
  await token.transfer(registryAddress, rewardPool);
  await registry.setRewardAmount(rewardAmount);

  return {
    token,
    registry,
    tokenAddress,
    registryAddress,
    implementationAddress,
    Registry,
    owner,
    minter,
    recipient,
    other,
    rewardAmount,
    rewardPool,
  };
}
