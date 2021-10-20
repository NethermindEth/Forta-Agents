import {
  Finding,
} from "forta-agent"
import { 
  Agent,
  runBlock,
  TestBlockEvent,
  TestTransactionEvent, 
} from "forta-agent-tools";
import { 
  BlockEvent,
  TransactionEvent, 
} from "forta-agent-tools/node_modules/forta-agent";
import { keccak256 } from "web3-utils";
import {
  provideHandleBlock,
  provideHandleTransaction,
  createFinding,
} from "./agent";
import TimeTracker from "./time.tracker";
import VesperFetcher from "./vesper.fetcher";
import vesper from './vesper.mock'

const threshold: number = 10;
const REBALANCE_SIGNATURE: string = keccak256("rebalance()"); 

describe("Vesper Rebalance agent tests suite", () => {
  const mockWeb3Call = jest.fn();
  const fetcher: VesperFetcher = new VesperFetcher(mockWeb3Call, vesper.CONTROLLER);
  const tracker: TimeTracker = new TimeTracker();
  const agent: Agent = {
    handleTransaction: provideHandleTransaction(fetcher, tracker),
    handleBlock: provideHandleBlock(fetcher, threshold, tracker),
  }

  beforeAll(() => vesper.initMock(mockWeb3Call));

  beforeEach(() => tracker.clear());

  it("should report empty findings on the first block handled", async () => {
    const block: BlockEvent = new TestBlockEvent();
    
    const findings: Finding[] = await runBlock(agent, block);
    expect(findings).toStrictEqual([]);
  });

  it("should report strategies with elapsed time since rebalance above the threshold", async () => {
    const startBlock = 200;
    const block: TestBlockEvent = new TestBlockEvent().setTimestamp(startBlock);
    
    let findings: Finding[] = await runBlock(agent, block);
    expect(findings).toStrictEqual([]);

    // first 2 mock stategies not rebalanced
    let txns: TransactionEvent[] = vesper.STRATEGIES.slice(2).map(
      (strat: string) => new TestTransactionEvent()
        .setTimestamp(startBlock + threshold)
        .addTraces({
          to: strat,
          input: REBALANCE_SIGNATURE,
        }),
    );
    block.setTimestamp(startBlock + threshold);
    findings = await runBlock(agent, block, ...txns);
    expect(findings).toStrictEqual([]);

    // rebalance 1st & 2nd mock strategies
    let tx = new TestTransactionEvent()
      .setTimestamp(startBlock + threshold + 1)
      .addTraces(...vesper.STRATEGIES.slice(0, 2).map(
        (strat: string) =>  {
         return  {
          to: strat,
          input: REBALANCE_SIGNATURE,
        }},
      ));
    block.setTimestamp(startBlock + threshold + 1);
    // This block should report the 1st & 2nd stategies (unreported in the initial block)
    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual(
      vesper.STRATEGIES.slice(0, 2).map(
        (strat: string) => createFinding(strat, threshold + 1, threshold),
      ),
    );

    // rebalance 3rd mock strategies
    tx = new TestTransactionEvent()
      .setTimestamp(startBlock + threshold + 2)
      .addTraces({
          to: vesper.STRATEGIES[2],
          input: REBALANCE_SIGNATURE,
        },
      );
    block.setTimestamp(startBlock + threshold + 2);
    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);

    // report all the strategies except the first 3
    block.setTimestamp(startBlock + 2 * threshold + 1);
    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual(
      vesper.STRATEGIES.slice(3).map(
        (strat: string) => createFinding(strat, threshold + 1, threshold),
      ),
    );
  });

  it("should report diferent elapsed times", async () => {
    const block: TestBlockEvent = new TestBlockEvent().setTimestamp(1);
    
    let findings: Finding[] = await runBlock(agent, block);
    expect(findings).toStrictEqual([]);

    // Rebalance 1st strategy
    block.setTimestamp(2);
    let tx: TransactionEvent = new TestTransactionEvent()
      .setTimestamp(2)
      .addTraces({
        to: vesper.STRATEGIES[0],
        input: REBALANCE_SIGNATURE,
      })
    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);

    // Rebalance 2nd strategy
    block.setTimestamp(3);
    tx = new TestTransactionEvent()
      .setTimestamp(3)
      .addTraces({
        to: vesper.STRATEGIES[1],
        input: REBALANCE_SIGNATURE,
      })
    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);

    // Rebalance all the remanning strategies
    block.setTimestamp(4);
    tx = new TestTransactionEvent()
      .setTimestamp(4)
      .addTraces(...vesper.STRATEGIES.slice(2).map(
        (strat: string) =>  {
         return  {
          to: strat,
          input: REBALANCE_SIGNATURE,
        }},
      ));
    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);

    // long time without rebalance 1st & 2nd strategies
    block.setTimestamp(4 + threshold);
    findings = await runBlock(agent, block);
    expect(findings).toStrictEqual([
      createFinding(vesper.STRATEGIES[0], threshold + 2, threshold),
      createFinding(vesper.STRATEGIES[1], threshold + 1, threshold),
    ]);
  });
});
