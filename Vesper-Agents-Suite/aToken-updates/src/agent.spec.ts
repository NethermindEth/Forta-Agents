import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction, 
  TransactionEvent,
} from "forta-agent"
import aeve from "./aeve.mock";
import { 
  provideHandleTransaction, 
  UPGRADED, 
} from "./agent";
import AeveFetcher, { TokenData } from "./aeve.fetcher";
import { createAddress, encodeParameter, TestTransactionEvent } from "forta-agent-tools";

const expectedFinding = (token: TokenData, implementation: string): Finding =>
  Finding.fromObject({
    name: 'Aeve aToken implementation changed',
    description: `'Token ${token.symbol} modified'`,
    alertId: "VESPER-8",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    protocol: 'AEVE',
    metadata: {
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      newImplementation: implementation,
    }
  })

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
    const addr1: string = createAddress("0xA1");
    const addr2: string = createAddress("0xA2");
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[1].address,
        undefined,
        encodeParameter("address", addr1),
      )
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[2].address,
        undefined,
        encodeParameter("address", addr2),
      );
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFinding(aeve.TOKENS[1], addr1),
      expectedFinding(aeve.TOKENS[2], addr2),
    ]);
  });

  it("should fetch the correct aTokens", async () => {
    const addr0: string = createAddress("0xA0");
    const addr1: string = createAddress("0xA1");
    const addr2: string = createAddress("0xA2");
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(3) // Fetch aToken of the block 3
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[0].address,
        undefined,
        encodeParameter("address", addr0),
      )
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[2].address,
        undefined,
        encodeParameter("address", addr2),
      )
      .addEventLog(
        UPGRADED,
        aeve.TOKENS[1].address,
        undefined,
        encodeParameter("address", addr1),
      );
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFinding(aeve.TOKENS[2], addr2),
    ]);
  });
});
