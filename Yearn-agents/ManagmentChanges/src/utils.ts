import { Finding, FindingType, FindingSeverity } from "forta-agent";
import { FindingGenerator, decodeParameter } from "forta-agent-tools";
import { ethers } from "ethers";
import { helperAbi, yearnDataProvider } from "./yearn.metadata";
import { TransactionEvent, EventType } from "forta-agent";
import LRU from "lru-cache";


const cache = new LRU<number, string[]>({ max: 10_000 });

export const updateManagementSignature = "UpdateManagement(address)";

export const updateManagementFeeSignature = "UpdateManagementFee(uint256)";

export const updatePerformanceFeeSignature = "UpdatePerformanceFee(uint256)";

export const createUpdateManagementFindingGenerator = (vaultAddress: string): FindingGenerator => {
  return (metadata) => {
    const setManagement = decodeParameter("address", metadata?.data);

    return Finding.fromObject({
      name: "Updated Management",
      description: "A Yearn Vault has updated its manager",
      alertId: "Yearn-9-1",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: "Yearn",
      metadata: {
        vaultAddress: vaultAddress,
        setManagement: setManagement,
      },
    });
  };
};

export const createUpdateManagementFeeFindingGenerator = (vaultAddress: string): FindingGenerator => {
  return (metadata) => {
    const setFee = decodeParameter("uint256", metadata?.data);

    return Finding.fromObject({
      name: "Updated Management Fee",
      description: "A Yearn Vault has updated its management fee",
      alertId: "Yearn-9-2",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: "Yearn",
      metadata: {
        vaultAddress: vaultAddress,
        setFee: setFee.toString(),
      },
    });
  };
};

export const createUpdatePerformanceFeeFindingGenerator = (vaultAddress: string): FindingGenerator => {
  return (metadata) => {
    const setFee = decodeParameter("uint256", metadata?.data);

    return Finding.fromObject({
      name: "Updated Performance Fee",
      description: "A Yearn Vault has updated its performance fee",
      alertId: "Yearn-9-3",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: "Yearn",
      metadata: {
        vaultAddress: vaultAddress,
        setFee: setFee.toString(),
      },
    });
  };
};

export const getYearnVaults = async (
  etherProvider: ethers.providers.JsonRpcProvider,
  blockNumber: number
): Promise<string[]> => {
  if (cache.get(blockNumber) === undefined) {
    const yearnHelper = new ethers.Contract(yearnDataProvider, helperAbi, etherProvider);
    const vaults = yearnHelper.assetsAddresses({ blockTag: blockNumber });

    cache.set(blockNumber, vaults);
  }

  return cache.get(blockNumber) as any;
};

// This functions was copied from forta-agent cli
// TODO check why function from forta module fails
export const createTransactionEvent = (receipt: any, block: any, networkId: number) => {
  const transaction = block.transactions.find((tx: any) => tx.hash === receipt.transactionHash)!;
  const tx: any = {
    hash: transaction.hash,
    from: transaction.from.toLowerCase(),
    to: transaction.to ? transaction.to.toLowerCase() : null,
    nonce: parseInt(transaction.nonce),
    gas: transaction.gas,
    gasPrice: transaction.gasPrice,
    value: transaction.value,
    data: transaction.input,
    r: transaction.r,
    s: transaction.s,
    v: transaction.v,
  };
  const addresses = {
    [tx.from]: true,
  };
  if (tx.to) {
    addresses[tx.to] = true;
  }

  const rcpt = {
    blockNumber: parseInt(receipt.blockNumber),
    blockHash: receipt.blockHash,
    transactionIndex: parseInt(receipt.transactionIndex),
    transactionHash: receipt.transactionHash,
    status: receipt.status === "0x1",
    logsBloom: receipt.logsBloom,
    contractAddress: receipt.contractAddress ? receipt.contractAddress.toLowerCase() : null,
    gasUsed: receipt.gasUsed,
    cumulativeGasUsed: receipt.cumulativeGasUsed,
    logs: receipt.logs.map((log: any) => ({
      address: log.address.toLowerCase(),
      topics: log.topics,
      data: log.data,
      logIndex: parseInt(log.logIndex),
      blockNumber: parseInt(log.blockNumber),
      blockHash: log.blockHash,
      transactionIndex: parseInt(log.transactionIndex),
      transactionHash: log.transactionHash,
      removed: log.removed,
    })),
    root: receipt.root ?? "",
  };
  rcpt.logs.forEach((log: any) => (addresses[log.address] = true));

  const blok = {
    hash: block.hash,
    number: parseInt(block.number),
    timestamp: parseInt(block.timestamp),
  };

  const trcs: any[] = [];

  return new TransactionEvent(EventType.BLOCK, networkId, tx, rcpt, trcs, addresses, blok);
};
