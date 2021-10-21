import {
  Finding,
  HandleTransaction, 
  TransactionEvent,
} from "forta-agent"
import aeve from "./aeve.mock";
import AeveFetcher from "./aeve.fetcher";
import { 
  provideHandleTransaction, 
  createFindingGenerator,
  UPGRADED, 
} from "./agent";
import { createAddress, encodeParameter, TestTransactionEvent } from "forta-agent-tools";

describe("aToken Updates agent tests suite", () => {
  const mockWeb3Call: any = jest.fn();
  const fetcher: AeveFetcher = new AeveFetcher(mockWeb3Call, aeve.PROVIDER)
  const handler: HandleTransaction = provideHandleTransaction(fetcher);

  beforeAll(() => aeve.initMock(mockWeb3Call));

  it("should return empty findings if no Upgraded event occur", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore Upgraded events in non aToken contracts", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        UPGRADED,
        createAddress("0xcafe"),
        undefined,
      );
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect multiple Upgraded events", async () => {
    const imp1: string = encodeParameter("address", createAddress("0xA1"));
    const imp2: string = encodeParameter("address", createAddress("0xA2"));
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[1].address,
        undefined,
        imp1,
      )
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[2].address,
        undefined,
        imp2,
      );
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFindingGenerator(aeve.TOKENS[1].symbol)({
        topics: ["", imp1],
        address: aeve.TOKENS[1].address,
      }),
      createFindingGenerator(aeve.TOKENS[2].symbol)({
        topics: ["", imp2],
        address: aeve.TOKENS[2].address,
      }),
    ]);
  });

  it("should fetch the correct aTokens", async () => {
    const imp0: string = encodeParameter("address", createAddress("0xA0"));
    const imp1: string = encodeParameter("address", createAddress("0xA1"));
    const imp2: string = encodeParameter("address", createAddress("0xA2"));
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(3) // Fetch aToken of the block 3
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[0].address,
        undefined,
        imp0,
      )
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[2].address,
        undefined,
        imp2,
      )
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[1].address,
        undefined,
        imp1,
      );
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFindingGenerator(aeve.TOKENS[2].symbol)({
        topics: ["", imp2],
        address: aeve.TOKENS[2].address,
      }),
    ]);
  });
});
