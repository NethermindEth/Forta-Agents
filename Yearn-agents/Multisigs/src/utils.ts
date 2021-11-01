import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { decodeParameter, decodeParameters, FindingGenerator } from "forta-agent-tools";

const provideOwnerAddedFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => Finding.fromObject({
    name: "Yearn multisig wallet event detected",
    description: "New owner added",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Yearn",
    alertId: "YEARN-1-2",
    metadata: {
      Multisig: ens,
      NewOwner: decodeParameter("address", metadata?.data),
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
      OldOwner: decodeParameter("address", metadata?.data),
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
      alertId: "YEARN-1-3",
      metadata: {
        Multisig: ens,
        TxHash: txHash,
        Payment: payment, 
      },
    });
  };

const provideERC20TransferFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => Finding.fromObject({
    name: "Yearn multisig transfer detected",
    description: "ERC20 transfer",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Yearn",
    alertId: "YEARN-1-4",
    metadata: {
      From: ens,
      To: metadata?.to,
      Value: metadata?.value,
    },
  });

const provideETHTransferFindingGenerator = (ens: string): FindingGenerator => 
  (metadata?: {[key: string]: any}): Finding => Finding.fromObject({
    name: "Yearn multisig transfer detected",
    description: "ETH transfer",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Yearn",
    alertId: "YEARN-1-5",
    metadata: {
      From: ens,
      To: metadata?.to,
      Value: metadata?.value,
    },
  });

export default {
  provideOwnerAddedFindingGenerator,
  provideOwnerRemovedFindingGenerator,
  provideExecutionSuccessFindingGenerator,
  provideExecutionFailureFindingGenerator,
  provideERC20TransferFindingGenerator,
  provideETHTransferFindingGenerator,
};
