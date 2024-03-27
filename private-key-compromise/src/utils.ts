import { timePeriodDays } from "./bot.config";

export const FIVE_MINS_IN_SECS = 60 * 5;
const ONE_DAY = 24 * 60 * 60;
export const ONE_WEEK_IN_SECS = ONE_DAY * 7;
export const TIME_PERIOD = timePeriodDays * ONE_DAY;

const ONE_BLOCK_IN_SECS = 12; // Based on ETH mainnet block time
export const ONE_DAY_IN_BLOCKS = ONE_DAY / 12;
export const SIX_HOURS_IN_BLOCKS = (ONE_DAY / 4) / ONE_BLOCK_IN_SECS;

export const MAX_OBJECT_SIZE = 1024 * 1024 * 2;

export interface NetworkData {
  threshold: string;
  tokenName: string;
}

export type AgentConfig = Record<number, NetworkData>;

export type Transfer = Record<
  string,
  {
    victimAddress: string;
    transferredAsset: string;
    valueInUSD: number;
    txHash: string;
  }[]
>;

export type AlertedAddress = {
  address: string;
  timestamp: number;
  minTransferAmountAlerted?: boolean;
  highTransferAmountAlerted?: boolean;
};

export type QueuedAddress = {
  timestamp: number;
  transfer: {
    from: string;
    to: string;
    asset: string;
    txHash: string;
  };
};

export const ERC20_TRANSFER_FUNCTION = "function transfer(address to, uint256 amount) public";

export const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

export const MKR_TOKEN_ABI = "function symbol() external view returns (bytes32)";

export const updateRecord = async (
  from: string,
  to: string,
  asset: string,
  hash: string,
  price: number,
  transferObj: Transfer
) => {
  /**
   * Logic is to persist data into transferObj as shown below
   *
   *  {
   *    attacker1: [{
   *                  victimAddress:   victim1
   *                  transferredAsset: asset1
   *                  valueInUSD:       price1
   *                  txHash:            hash1
   *                },
   *                {
   *                  victimAddress:   victim2
   *                  transferredAsset: asset2
   *                  valueInUSD:       price2
   *                  txHash:            hash2
   *                }]
   *    attacker2: [{
   *                  victimAddress:   victim1
   *                  transferredAsset: asset1
   *                  valueInUSD:       price1
   *                  txHash:            hash1
   *                },
   *                {
   *                  victimAddress:   victim2
   *                  transferredAsset: asset2
   *                  valueInUSD:       price2
   *                  txHash:            hash2
   *                },
   *                {
   *                  victimAddress:   victim3
   *                  transferredAsset: asset3
   *                  valueInUSD:       price3
   *                  txHash:            hash3
   *                }]
   *    ...
   *  }
   */

  // if the attacker is already in transferObj and the victim is not, push the new victim address
  if (transferObj[to] && !transferObj[to].some((el) => el.victimAddress == from)) {
    transferObj[to].push({ victimAddress: from, transferredAsset: asset, valueInUSD: price, txHash: hash });
  }

  // if the attacker is not in db, append it
  else if (!transferObj[to]) {
    transferObj[to] = [{ victimAddress: from, transferredAsset: asset, valueInUSD: price, txHash: hash }];
  }
};

export const deepMerge = (target: Transfer, source: Transfer) => {
  const isObject = (obj: Transfer) => obj && typeof obj === "object";

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      const merged = targetValue.concat(sourceValue);
      target[key] = merged.filter((value, index, self) => {
        return self.findIndex((v) => v.victimAddress === value.victimAddress) === index;
      });
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
};
