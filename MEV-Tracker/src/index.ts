import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType
} from "forta-agent";
import axios from "axios";

const INTERESTING_PROTOCOLS: string[] = [
  "0x11111112542d85b3ef69ae05771c2dccff4faa26", // 1inch V3
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f", // SushiSwap Router
  "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3
  "0xDef1C0ded9bec7F1a1670819833240f027b25EfF", // 0x
  "0x881D40237659C251811CEC9c364ef91dC08D300C", // Metamask Swap Router
  "0xA58f22e0766B3764376c92915BA545d583c19DBc", // Alchemist Coin MistX Router
  "0x9008D19f58AAbD9eD0D60971565AA8510560ab41" // Gnosis Protocol
];
const API_ENDPOINT: string =
  "https://blocks.flashbots.net/v1/blocks?block_number=";

export const getAPIUrl = (block: number) => `${API_ENDPOINT}${block}`;

const provideHandleTransaction = (
  getter: any,
  protocols: string[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const protocolsInUse: string[] = protocols.filter(
      (p: string) => txEvent.addresses[p.toLowerCase()]
    );

    if (protocolsInUse.length === 0) return findings;

    const { data } = await getter(getAPIUrl(txEvent.blockNumber));

    // check if the block has a bundle
    if (data.blocks.length === 0) return findings;
    // check if the transaction is inside the bundle
    const currentTxn = data.blocks[0].transactions.filter(
      (txn: any) => txn.transaction_hash === txEvent.hash
    );
    if (currentTxn.length === 0) return findings;
    const txn = currentTxn[0];

    // report findings
    protocolsInUse.forEach((p: string) => {
      findings.push(
        Finding.fromObject({
          name: "MEV Tracker - Protocol Interaction Detection",
          description: `A protocol used inside MEV bundle`,
          alertId: "NETHFORTA-11",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Info,
          metadata: {
            protocol: p,
            bundle_type: txn.bundle_type,
            hash: txEvent.hash
          }
        })
      );
    });

    return findings;
  };
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(axios.get, INTERESTING_PROTOCOLS)
};
