import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import { utils } from 'ethers';

const SYNTH_SWAP_ADDRESS: string = "0x58A3c68e2D3aAf316239c003779F71aCb870Ee47";
export const CROSS_CHAIN_SWAP_SIGNATURE: string = 
  'evet TokenUpdate(indexed uint256 token_id, indexed address owner, indexed address synth, uint256 balance)';
export const CROSS_CHAIN_SWAP_IFACE: utils.Interface = new utils.Interface([CROSS_CHAIN_SWAP_SIGNATURE]);

export const provideCrossAssetSwap = (
  alertID: string,
  address: string
): HandleTransaction => async (txEvent: TransactionEvent): Promise<Finding[]> => 
  txEvent.filterLog(
    CROSS_CHAIN_SWAP_SIGNATURE,
    address
  ).map((log: utils.LogDescription) => Finding.fromObject({
    name: "Cross Asset Swaps Interaction",
    description: "TokenUpdate event emitted",
    alertId: alertID,
    protocol: "Curve",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      tokenId: `${log.args["token_id"]}`,
      owner: log.args["owner"],
      synth: log.args["synth"],
      balance: `${log.args["underlying_balance"]}`,
    }
  }));
  
export default {
  handleTransaction: provideCrossAssetSwap(
    "CURVE-5",
    SYNTH_SWAP_ADDRESS,
  ),
};
