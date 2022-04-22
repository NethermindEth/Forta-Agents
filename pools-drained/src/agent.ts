import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Trace,
  LogDescription,
  getEthersProvider,
} from "forta-agent";
import utils from "./utils";
import { utils as ethers } from "ethers";
import abi from "./abi";
import PairFetcher from "./pair.fetcher";

type Desc = ethers.TransactionDescription;

const provideHandleTransaction = (fetcher: PairFetcher) => 
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const details: Record<string, Record<string, number>> = {};
    const pairs: Set<string> = new Set<string>();

    await Promise.all(
      txEvent.traces.map(async (trace: Trace) => {
        const txn = {
          data: trace.action.input,
          value: trace.action.value,
          to: trace.action.to,
        };
        try { // is pair V2
          const desc: Desc = abi.V2_IFACE.parseTransaction(txn);
          const [valid, token0, token1] = await fetcher.getV2Data(txn.to, txEvent.blockNumber);
          if(valid && (utils.v2Create2(token0, token1).toLowerCase() === txn.to)){
            if(!pairs.has(txn.to)){
              pairs.add(txn.to);
              details[txn.to] = {
                [token0]: 0,
                [token1]: 0,
              }
            }
            const calls: number = utils.v2Transfers(desc);
            details[txn.to][token0] += calls;
            details[txn.to][token1] += calls;
          }
        } catch (e) {} 
        try { // is pair V3
          const desc: Desc = abi.V3_IFACE.parseTransaction(txn);
          const [valid, token0, token1, fee] = await fetcher.getV3Data(txn.to, txEvent.blockNumber);
          if(valid && (utils.v3Create2(token0, token1, fee).toLowerCase() === txn.to)){
            if(!pairs.has(txn.to)){
              pairs.add(txn.to);
              details[txn.to] = {
                [token0]: 0,
                [token1]: 0,
              }
            }
            const calls: number = utils.v3Transfers(desc);
            details[txn.to][token0] += calls;
            details[txn.to][token1] += calls;
          }
        } catch (e) {} 
      })
    );

    const drained: Record<string, boolean> = {};
    const transfers: LogDescription[] = txEvent.filterLog(abi.TRANSFER);

    transfers.forEach((transfer: LogDescription) => {
      const token: string = transfer.address.toLowerCase();
      const to: string    = transfer.args.to.toLowerCase();
      const from: string  = transfer.args.from.toLowerCase();
      if(pairs.has(to) && Object.keys(details[to]).includes(token)){
        details[to][token] -= 1;
        if(details[to][token] < 0) drained[to] = true;
      }
      if(pairs.has(from) && Object.keys(details[from]).includes(token)){
        details[from][token] -= 1;
        if(details[from][token] < 0) drained[from] = true;
      }
    });

    const pairsInDanger: string[] = Object.keys(drained);
    if(pairsInDanger.length > 0){
      findings.push(
        Finding.fromObject({
          name: "Uniswap pools suspicious activities",
          description: "Some pairs might be being drained",
          alertId: "NETHFORTA-UNI",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Critical,
          protocol: "Uniswap",
          metadata: {
            pairs: pairsInDanger.toString(),
          }
        })
      );
    }

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(new PairFetcher(getEthersProvider())),
};
