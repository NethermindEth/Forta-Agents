import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Trace,
  LogDescription,
  getEthersProvider,
} from "forta-agent";
import utils, { DEAD_ADDRESS, ZERO_ADDRESS } from "./utils";
import { utils as ethers, BigNumber } from "ethers";
import abi from "./abi";
import PairFetcher from "./pair.fetcher";

type Desc = ethers.TransactionDescription;

export const provideHandleTransaction = (fetcher: PairFetcher) => async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  /* details: 
  example: details[DAI/WETH pool address][DAI address] 
  First using the utils.v2(/v3)Transfers, it calculates the number of txns required per token, by definition, for each Uniswap function, i.e. for a regular swap there's one transfer for token0 and one for token1, so:
  details[DAI/WETH][DAI] += 1;
  details[DAI/WETH][WETH] += 1;
  It then checks the actual transfers that happened in the tx and for each it substracts one from the details. In the end, if nothing malicious happened, the details[pair][tokenX] must be 0. 
  If it's negative, it means that one or more unexpected transfers happened and so it raises an alert. 
  The problem is that the bot took into account only the way Uniswap functions work (i.e. how many Transfer are required per function) and not the tokens themselves, which for any reason may execute more than one transfer per transfer (i.e. send some amount to 0x)
  */
  const details: Record<string, Record<string, number>> = {};
  const pairs: Set<string> = new Set<string>();

  await Promise.all(
    txEvent.traces.map(async (trace: Trace) => {
      const txn = {
        data: trace.action.input,
        value: trace.action.value,
        to: trace.action.to,
      };
      try {
        // is pair V2
        // desc.name is used in the utils.v2Transfers in order to calculate the required transfers per function
        const desc: Desc = abi.V2_IFACE.parseTransaction(txn);
        const [valid, token0, token1] = await fetcher.getV2Data(txn.to, txEvent.blockNumber);
        if (valid && utils.v2Create2(token0, token1) === txn.to) {
          if (!pairs.has(txn.to)) {
            pairs.add(txn.to);
            // Initializes the pair's details record.
            details[txn.to] = {
              [token0]: 0,
              [token1]: 0,
            };
          }
          const calls: number = utils.v2Transfers(desc);
          // Here the expected number of calls per function for each token of the pair is added.
          details[txn.to][token0] += calls;
          details[txn.to][token1] += calls;
        }
      } catch (e) {}
      try {
        // is pair V3
        const desc: Desc = abi.V3_IFACE.parseTransaction(txn);
        const [valid, token0, token1, fee] = await fetcher.getV3Data(txn.to, txEvent.blockNumber);
        if (valid && utils.v3Create2(token0, token1, fee) === txn.to) {
          if (!pairs.has(txn.to)) {
            pairs.add(txn.to);
            details[txn.to] = {
              [token0]: 0,
              [token1]: 0,
            };
          }
          const calls: number = utils.v3Transfers(desc);
          details[txn.to][token0] += calls;
          details[txn.to][token1] += calls;
        }
      } catch (e) {}
    })
  );
  // If a pair is decided to being drained, it's added in the set
  const drained: Set<string> = new Set<string>();
  const transfers: LogDescription[] = txEvent.filterLog(abi.TRANSFER);
  // data is the helper function for the "amounts" which is the actual Record
  const data: Record<string, Record<string, BigNumber>> = {};

  /* amounts is a record of each token's amount sent to every "to" address.
  Example: amounts[DAI][userX] = 3432423;
  I've added this so, in the end, we can decide, for each token, to which address were the most tokens sent. 
  As the number of possible tokens and possible "to" addresses is infinite,
  the Proxy below is used to automatically initialize the record for each token, i.e. amounts[DAI] = {}
  [no need to spend much time on this]
  */
  const amounts = new Proxy(data, {
    get: (target: Record<string, Record<string, BigNumber>>, name: string) => {
      if (!target[name]) target[name] = {};
      return target[name];
    },
  });

  transfers.forEach((transfer: LogDescription) => {
    const token: string = transfer.address;
    const to: string = transfer.args.to.toLowerCase();
    const from: string = transfer.args.from.toLowerCase();
    if (pairs.has(to) && Object.keys(details[to]).includes(token)) {
      // Here is where 1 is substracted for each actual transfer.
      details[to][token] -= 1;
      // It's only negative if there are more transfers than we initially expected.
      if (details[to][token] < 0) drained.add(to);
    }
    if (pairs.has(from) && Object.keys(details[from]).includes(token)) {
      // Here I've added the calculation for the sum of the amount of each token sent to each user during the tx
      if (!amounts[token][to]) {
        amounts[token][to] = transfer.args.value;
      } else {
        amounts[token][to] = amounts[token][to].add(transfer.args.value);
      }
      details[from][token] -= 1;
      if (details[from][token] < 0) drained.add(from);
    }
  });
  // Only if there's a pair added to the set, that's potentially being drained.
  if (drained.size > 0) {
    Object.keys(amounts).forEach((token) => {
      // Returns the "to" address where the most tokens were sent for each token
      const maxToPerToken = Object.keys(amounts[token]).reduce((max: string, to) =>
        amounts[token][max].gt(amounts[token][to]) ? max : to
      );
      if (maxToPerToken == ZERO_ADDRESS || maxToPerToken == DEAD_ADDRESS || maxToPerToken == token) {
        findings.push(
          Finding.fromObject({
            name: "Uniswap pools suspicious activities",
            description: "Some pairs might be being drained",
            alertId: "NETHFORTA-UNI",
            type: FindingType.Suspicious,
            severity: FindingSeverity.Critical,
            protocol: "Uniswap",
            metadata: {
              pairs: Array.from(drained).toString(),
            },
          })
        );
      }
    });
  }

  return findings;
};

export default {
  handleTransaction: provideHandleTransaction(new PairFetcher(getEthersProvider())),
};
