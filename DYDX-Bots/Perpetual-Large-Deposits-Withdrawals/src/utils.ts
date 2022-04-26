import { providers } from "ethers";
import { BigNumber } from "ethers";

// Monitored events.
export const EVENTS = [
  "event LogDeposit(address depositorEthKey, uint256 starkKey, uint256 vaultId, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount)",
  "event LogWithdrawalPerformed(uint256 ownerKey, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount, address recipient)",
  "event LogMintWithdrawalPerformed(uint256 ownerKey, uint256 assetType, uint256 nonQuantizedAmount, uint256 quantizedAmount, uint256 assetId)",
];

export const PERPETUAL_CONTRACT = "0xD54f502e184B6B739d7D27a6410a67dc462D69c8";

export const ERC20_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
];
const perpetual = "0x2C0df87E073755139101b35c0A51e065291cc2d3";
// 0x3FeD7bF5Bf3E738bc30fBe61B048fDcb82368545 withdrawal/deposits

export const extractTokenAddress = async (
  assetType: BigNumber,
  provider: providers.Provider
): Promise<string> => {
  const SELECTOR_OFFSET = 0x20;
  const SELECTOR_SIZE = 4;
  const TOKEN_CONTRACT_ADDRESS_OFFSET = SELECTOR_OFFSET + SELECTOR_SIZE;

  // extract AssetInfo first.
  // TODO: Find the mapping position
  const assetInfo = BigNumber.from(
    await provider.getStorageAt("0x3FeD7bF5Bf3E738bc30fBe61B048fDcb82368545", 1)
  );
  // extract token address
  const position = assetInfo.add(BigNumber.from(TOKEN_CONTRACT_ADDRESS_OFFSET));
  const address = await provider.getStorageAt(perpetual, position);

  return address;
};
