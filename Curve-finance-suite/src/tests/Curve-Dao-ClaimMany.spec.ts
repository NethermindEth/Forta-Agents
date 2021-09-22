import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
  Trace,
  TransactionEvent,
} from "forta-agent";
import provideclaimManyAgent, {
  web3,
  claimMany,
} from "../agents/Curve-Dao-ClaimMany";

interface TraceInfo {
  from: string;
  to: string;
  input: string;
}

const ADDRESS = "0x1111";
const PAYOUTADDRESS = "0x5C34E725CcA657F02C1D81fb16142F6F0067689b";
const ALERTID = "NETHFORTA-21-7";

describe("Claim Many Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideclaimManyAgent(ALERTID, ADDRESS);
  });

  const createTxEvent = (
    data: TraceInfo[],
    signature: string,
    protocol: boolean
  ): TransactionEvent => {
    const traces: Trace[] = data.map((traceInfo: TraceInfo) => {
      return {
        action: {
          from: traceInfo.from,
          input: traceInfo.input,
          to: traceInfo.to,
        },
      } as Trace;
    });

    const txn: TransactionEvent = {
      transaction: { data: signature } as any,
      addresses: { "0x1111": protocol },
      receipt: {} as any,
      block: {} as any,
      traces,
    } as any;

    console.log(txn);
    return txn;
  };

  it("create event but from different protocol", async () => {
    const signature = web3.eth.abi.encodeFunctionCall(claimMany as any, [
      [...Array(20)].map(
        (_, i) => "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      ) as any,
    ]);
    const tx = createTxEvent([], signature, false);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("create and send a tx with the tx event", async () => {
    const signature = web3.eth.abi.encodeFunctionCall(claimMany as any, [
      [...Array(20)].map(
        (_, i) => "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      ) as any,
    ]);
    const tx = createTxEvent([], signature, true);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Claim Rewards function called",
        description: "Claim Rewards function called on pool",
        alertId: ALERTID,
        protocol: "ethereum",
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {},
      }),
    ]);
  });
});
