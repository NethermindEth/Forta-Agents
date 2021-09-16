import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
  Trace,
} from "forta-agent";
import Web3 from "web3";
import provideMıgratePoolAgent from "../agents/pool_Migration";

const abi = new Web3().eth.abi;
const ADDRESS = "0X1111";
const ALERT_ID = "test";

interface TraceInfo {
  from: string;
  to: string;
  input: string;
}

const createTxEvent = (data: TraceInfo[]): TransactionEvent => {
  const traces: Trace[] = data.map((traceInfo: TraceInfo) => {
    return {
      action: {
        from: traceInfo.from,
        input: traceInfo.input,
        to: traceInfo.to,
      },
    } as Trace;
  });

  const txn: TransactionEvent = { traces } as TransactionEvent;
  return txn;
};

const createAddress = (suffix: string): string => {
  return Web3.utils.leftPad(suffix, 40);
};

describe("Pool Migration Agent", () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideMıgratePoolAgent(ALERT_ID, ADDRESS);
  });

  it("should return a finding", async () => {
    const _old_pool = createAddress("0x1");
    const _new_pool = createAddress("0x2");
    const _from = createAddress("0x3");
    const _input: string = abi.encodeFunctionCall(
      {
        name: "migrate_to_new_pool",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "_old_pool",
          },
          {
            type: "address",
            name: "_new_pool",
          },
          {
            type: "uint256",
            name: "_amount",
          },
        ],
      },
      [_old_pool, _new_pool, "1000"]
    );
    console.log(_input);
    const txEvent: TransactionEvent = createTxEvent([
      { input: _input, to: ADDRESS, from: _from },
    ]);
    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Pool Migration Finding",
        description: "Pool migrated to new address",
        alertId: ALERT_ID,
        severity: FindingSeverity.Medium,
        type: FindingType.Unknown,
        metadata: {
          from: _from,
          input: _input,
          to: ADDRESS,
        },
      }),
    ]);
  });

  it("should return empty finding cause bad input", async () => {
    const _from = createAddress("0x3");
    const _input: string = "bad sig";

    const txEvent: TransactionEvent = createTxEvent([
      { input: _input, to: ADDRESS, from: _from },
    ]);
    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding cause bad function selector", async () => {
    const _old_pool = createAddress("0x1");
    const _new_pool = createAddress("0x2");
    const _from = createAddress("0x3");

    const _input: string = abi.encodeFunctionCall(
      {
        name: "wrong function selector",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "_old_pool",
          },
          {
            type: "address",
            name: "_new_pool",
          },
          {
            type: "uint256",
            name: "_amount",
          },
        ],
      },
      [_old_pool, _new_pool, "1000"]
    );

    const txEvent: TransactionEvent = createTxEvent([
      { input: _input, to: ADDRESS, from: _from },
    ]);
    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
