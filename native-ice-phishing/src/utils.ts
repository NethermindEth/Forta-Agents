import { ethers } from "forta-agent";

const ONE_DAY = 24 * 60 * 60;
const timePeriodDays = 5;
export const TIME_PERIOD = timePeriodDays * ONE_DAY;

export const MAX_OBJECT_SIZE = 4 * 1024 * 1024; // 4 MB

export const POLYGON_MATIC_ADDRESS =
  "0x0000000000000000000000000000000000001010";

export const WITHDRAW_SIG = "3ccfd60b";
export const BALANCEOF_SIG = "70a08231";
export const OWNER_ABI = [
  "function owner() public view returns (address)",
  "function getOwner() public view returns (address)",
];

export const toTxCountThreshold = 2000;
export const fromTxCountThreshold = 9999;
export const transfersThreshold = 7;

export type Transfer = {
  from: string;
  fromNonce: number;
  fundingAddress: string;
  latestTo: string;
  value: string;
  timestamp: number;
};

export type Data = {
  nativeTransfers: Record<string, Transfer[]>;
  alertedAddresses: string[];
  alertedHashes: string[];
};

interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export interface Response {
  status: string;
  message: string;
  result: Transaction[];
}

export const filterConflictingEntries: (transfers: Transfer[]) => Transfer[] = (
  transfers
) => {
  return transfers.filter((transfer, _, self) => {
    const conflictingEntries = self.filter((otherTransfer) => {
      const isFromSame = otherTransfer.from === transfer.from;
      if (!isFromSame) return false;

      // Check if transfer value is out of range (80% - 120%)
      const lowerBound = ethers.BigNumber.from(otherTransfer.value)
        .mul(8)
        .div(10);
      const upperBound = ethers.BigNumber.from(otherTransfer.value)
        .mul(12)
        .div(10);
      const bnValue = ethers.BigNumber.from(transfer.value);
      const isValueOutOfRange =
        bnValue.lt(lowerBound) || bnValue.gt(upperBound);

      // Check if transfer value is unique
      const isValueUnique = !ethers.BigNumber.from(otherTransfer.value).eq(
        bnValue
      );

      // Check if latestTo is unique
      const isLatestToUnique = otherTransfer.latestTo !== transfer.latestTo;

      // Return true if any of the conditions are violated
      return !(isValueOutOfRange || isValueUnique || isLatestToUnique);
    });

    // Keep only the first conflicting entry
    return (
      conflictingEntries.length === 0 ||
      self.indexOf(transfer) === self.indexOf(conflictingEntries[0])
    );
  });
};

export const checkRoundValue = (num: ethers.BigNumber): boolean => {
  const divisor = ethers.BigNumber.from("1000000000000000000"); // equivalent to 10^18
  const quotient = num.div(divisor);
  return quotient.mul(divisor).eq(num);
};
