import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from 'general-agents-module';
import Web3 from 'web3';
import { AbiCoder } from 'web3-eth-abi';

export const YFI_GOVERNANCE_SIGNATURE: string = "setGovernance(address)";
export const YFI_ADDRESS: string = "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e";
const abi: AbiCoder = new Web3().eth.abi;

export const createFinding: FindingGenerator = (metadata: { [key: string]: any } | undefined): Finding => {
  const input: string = metadata?.input;
  const addr: string = abi.decodeParameter('address', input.slice(10))[0];
  return Finding.fromObject({
    name: "YFI Governance address changed",
    description: `New owner is (${addr})`,
    alertId: "NETHFORTA-27",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      previousOwner: metadata?.from,
      newOwner: addr,
    },
  });
};

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const txHandler = provideFunctionCallsDetectorAgent(
    createFinding,
    YFI_GOVERNANCE_SIGNATURE,
    { to: YFI_ADDRESS },
  );
  const findings = await txHandler(txEvent);
  return findings;
}

export default {
  handleTransaction,
};
