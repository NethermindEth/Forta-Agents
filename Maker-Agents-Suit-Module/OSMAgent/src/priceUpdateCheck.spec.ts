import {
  FindingType,
  FindingSeverity,
  Finding,
  Trace,
  HandleTransaction,
  createTransactionEvent,
  TransactionEvent,
} from "forta-agent";
import agent, { functionSignature } from "./priceUpdateCheck";

import Web3 from "web3";
const abi = new Web3().eth.abi;

interface TraceInfo {
  from: string;
  to: string;
  input: string;
}

function traces(data: any) {
  return data.map((traceInfo: TraceInfo) => {
    return {
      action: {
        from: traceInfo.from,
        input: traceInfo.input,
        to: traceInfo.to,
      },
    } as Trace;
  });
}

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("No response if different protocol", async () => {
    const txEvent: TransactionEvent = {
      addresses: { "0x0000000000000000000000000000000000000000": true },
      traces: [],
    } as any;

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Time < 10min, nothing returned, first time function call", async () => {
    const trace = traces([
      {
        from: "0x",
        to: "0x10",
        input: abi.encodeFunctionSignature(functionSignature as any),
      },
    ]);

    console.log(abi.encodeFunctionSignature(functionSignature as any));
    const txEvent: TransactionEvent = {
      addresses: { "0x2417c2762ec12f2696f62cfa5492953b9467dc81": true },
      traces: trace,
      block: { timestamp: 1469021581 } as any, // Friday, September 24, 2021 10:03:20 PM
    } as any;

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
  // it("getStatus after time has lasped > 10 min and the status is still false", async () => {
  //   const txEvent: TransactionEvent = {
  //     addresses: { "0x2417c2762ec12f2696f62cfa5492953b9467dc81": true },
  //     traces: [],
  //     block: { timestamp: 1469022581 } as any, // 19 minutes
  //   } as any;

  //   const findings = await handleTransaction(txEvent);
  //   expect(findings).toStrictEqual([]);
  // });
  // it("getStatus after time has lasped < 10 min and the status is true, should return a critical shoutout", async () => {
  //   const txEvent: TransactionEvent = {
  //     addresses: { "0x2417c2762ec12f2696f62cfa5492953b9467dc81": true },
  //     traces: [],
  //     block: { timestamp: 1469232581 } as any, // Friday, September 24, 2021 10:03:20 PM
  //   } as any;

  //   const findings = await handleTransaction(txEvent);
  //   expect(findings).toStrictEqual([
  //     Finding.fromObject({
  //       name: "Method not called within the first 10 minutes",
  //       description:
  //         "Poke() functioon not called within 10 minutes of the hour",
  //       alertId: "NETHFORTA-24",
  //       severity: 5,
  //       type: 0,
  //     }),
  //   ]);
  // });
});
