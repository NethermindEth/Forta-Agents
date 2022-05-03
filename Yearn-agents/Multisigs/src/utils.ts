import { Finding, FindingSeverity, FindingType, Log } from "forta-agent";
import { decodeParameter, decodeParameters, FindingGenerator } from "forta-agent-tools";
import LRU from "lru-cache";

// Signatures
const ADDED_OWNER: string = "AddedOwner(address)";
const REMOVED_OWNER: string = "RemovedOwner(address)";
const EXECUTION_SUCCESS: string = "ExecutionSuccess(bytes32,uint256)";
const EXECUTION_FAILURE: string = "ExecutionFailure(bytes32,uint256)";
const TRANSFER: string = "Transfer(address,address,uint256)";

const createFetcher = (web3: any) => {
  const cache: LRU<string, string> = new LRU<string, string>({ max: 100 });

  return async (block: number, ens: string): Promise<string> => {
    const key: string = `${block}-${ens}`;
    if(cache.has(key))
      return cache.get(key) as string;
    const addr: string = await web3.eth.ens.getAddress(ens);
    cache.set(key, addr);
    return addr;
  }
}

const provideOwnerAddedFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => Finding.fromObject({
    name: "Yearn multisig wallet event detected",
    description: "New owner added",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Yearn",
    alertId: "YEARN-1-1",
    metadata: {
      Multisig: ens,
      NewOwner: decodeParameter("address", metadata?.data).toLowerCase(),
    },
  });

const provideOwnerRemovedFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => Finding.fromObject({
    name: "Yearn multisig wallet event detected",
    description: "New owner removed",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Yearn",
    alertId: "YEARN-1-2",
    metadata: {
      Multisig: ens,
      OldOwner: decodeParameter("address", metadata?.data).toLowerCase(),
    },
  });

const provideExecutionSuccessFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => {
    const { 0: txHash, 1: payment } = decodeParameters(["bytes32", "uint256"], metadata?.data);

    return Finding.fromObject({
      name: "Year multisig wallet interaction detected",
      description: "Transaction executed succesfully",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      protocol: "Yearn",
      alertId: "YEARN-1-3",
      metadata: {
        Multisig: ens,
        TxHash: txHash,
        Payment: payment, 
      },
    });
  };

const provideExecutionFailureFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => {
    const { 0: txHash, 1: payment } = decodeParameters(["bytes32", "uint256"], metadata?.data);

    return Finding.fromObject({
      name: "Year multisig wallet interaction detected",
      description: "Transaction failed",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      protocol: "Yearn",
      alertId: "YEARN-1-4",
      metadata: {
        Multisig: ens,
        TxHash: txHash,
        Payment: payment, 
      },
    });
  };

const provideERC20TransferFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => {
    const value: BigInt = BigInt(decodeParameter("uint256", metadata?.data));
    const to: string = decodeParameter("address", metadata?.topics[2]);

    return Finding.fromObject({
      name: "Yearn multisig transfer detected",
      description: "ERC20 transfer",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      protocol: "Yearn",
      alertId: "YEARN-1-5",
      metadata: {
        From: ens,
        To: to.toLowerCase(),
        Value: value.toString(),
        TokenAddress: metadata?.address,
      },
    })
  };

const provideETHTransferFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => Finding.fromObject({
    name: "Yearn multisig transfer detected",
    description: "ETH transfer",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Yearn",
    alertId: "YEARN-1-6",
    metadata: {
      From: ens,
      To: metadata?.to,
      Value: metadata?.value,
    },
  });

const provideERC20filter = (addr: string) => {
  const lowerAddr: string = addr.toLowerCase();

  return (log: Log): boolean => {
    // check that the event has 2 indexed topics
    if(log.topics.length != 3) 
      return false;

    try {
      // check that both indexed parameters fit into address type
      const from: string = decodeParameter("address", log.topics[1]).toLowerCase();
      decodeParameter("address", log.topics[2]);

      // check that from is the expected address
      if(lowerAddr !== from)
        return false;
    }
    catch { 
      return false; 
    }

    return true;
  };
};

export default {
  provideOwnerAddedFindingGenerator,
  provideOwnerRemovedFindingGenerator,
  provideExecutionSuccessFindingGenerator,
  provideExecutionFailureFindingGenerator,
  provideERC20TransferFindingGenerator,
  provideETHTransferFindingGenerator,
  provideERC20filter,
  ADDED_OWNER,
  REMOVED_OWNER,
  EXECUTION_SUCCESS,
  EXECUTION_FAILURE,
  TRANSFER,
  createFetcher,
};
