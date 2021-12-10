import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { 
  createAddress, 
  TestTransactionEvent,
  encodeParameters, 
} from "forta-agent-tools";
import agent from "./agent";
import { when } from "jest-when";
import abi from "./abi";

const POOLS: string[] = [];

const rampFinding = (
  address: string,
  oldA: string,
  newA: string,
  initialTime: string,
  futureTime: string,
) => Finding.fromObject({
  name: "Pools event detected",
  description: "RampA event emitted on pool",
  alertId: "CURVE-10-1",
  protocol: "Curve Finance",
  type: FindingType.Info,
  severity: FindingSeverity.Info,
  metadata: {
    address,
    oldA,
    newA,
    initialTime,
    futureTime,
  },
})

const stopRampFinding = (
  address: string,
  A: string,
  T: string,
) => Finding.fromObject({
  name: "Pools event detected",
  description: "StopRampA event emitted on pool",
  alertId: "CURVE-10-2",
  protocol: "Curve Finance",
  type: FindingType.Info,
  severity: FindingSeverity.Info,
  metadata: {
    address,
    A, T,
  },
})

describe("Pools RampA tests suite", () => {
  const mockFetcher: any = { isPool: jest.fn() };
  const handler: HandleTransaction = agent.provideHandleTransaction(mockFetcher);

  beforeAll(() => {
    for(let i = 0; i < 5; ++i){
      POOLS.push(createAddress(`0xabc${i}`));
      // true for each pool
      when(mockFetcher.isPool)
        .calledWith(POOLS[i])
        .mockReturnValue(true);
    }
    // false in any other case
    when(mockFetcher.isPool)
      .calledWith(when(() => true))
      .mockReturnValue(false);
  });

  it("should return 0 findings on empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return 0 findings on other events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        "signature()",
        POOLS[0],
      )
      .addEventLog(
        "Custom(uint256, uint256)",
        POOLS[1],
        encodeParameters(["uint256", "uint256"], ["20", "10"]),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding for each Pool event", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        abi.POOL_IFACE.getEvent('RampA').format("sighash"),
        createAddress("0x12"),
        encodeParameters(
          ["uint256", "uint256", "uint256", "uint256"], 
          ["20", "10", "5", "1"],
        ),
      )
      .addEventLog(
        abi.POOL_IFACE.getEvent('StopRampA').format("sighash"),
        createAddress("0x1a2"),
        encodeParameters(
          ["uint256", "uint256"], 
          ["2012", "100000"]
        ),
      )
      .addEventLog(
        abi.POOL_IFACE.getEvent('RampA').format("sighash"),
        POOLS[2],
        encodeParameters(
          ["uint256", "uint256", "uint256", "uint256"], 
          ["20", "10", "5", "1"],
        ),
      )
      .addEventLog(
        abi.POOL_IFACE.getEvent('StopRampA').format("sighash"),
        POOLS[3],
        encodeParameters(
          ["uint256", "uint256"], 
          ["2012", "100000"],
        ),
      )
      .addEventLog(
        abi.POOL_IFACE.getEvent('StopRampA').format("sighash"),
        POOLS[4],
        encodeParameters(
          ["uint256", "uint256"], 
          ["1", "0"],
        ),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      rampFinding(POOLS[2], "20", "10", "5", "1"),
      stopRampFinding(POOLS[3], "2012", "100000"),
      stopRampFinding(POOLS[4], "1", "0"),
    ]);
  });
});
