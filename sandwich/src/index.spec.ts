import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  EventType,
  BlockEvent,
  Network,
  getJsonRpcUrl,
} from "forta-agent";
import agent from ".";
import Web3 from "web3";
const web3 = new Web3(getJsonRpcUrl());

import { swap, token0, token1 } from "./abi";
import {
  detectIfAttackPossible,
  minimumInputAmountForFrontrunningT1,
  generateBlockEvent,
} from "./utils";

const generateTx = (
  reserve1: number,
  resever2: number,
  account: string,
  amountOut1: string,
  amountOut2: string,
  minimumRecieved: number
) => {
  const data = web3.eth.abi.encodeParameters(
    ["uint256", "uint256", "uint256"],
    [reserve1, resever2, minimumRecieved]
  );

  const signFunctionTx = web3.eth.abi.encodeFunctionCall(swap as any, [
    amountOut1,
    amountOut2,
    account,
    data,
  ]);

  return signFunctionTx;
};

describe("Agent for SandWich Attack", () => {
  let handleBlock: HandleBlock;
  let reserveAmount0 = 10000;
  let reserveAmount1 = 10000;

  const account1 = "0xf2AfC6F347C3791cBBFe75248DBA18d719026b23";
  const account2 = "0x4FAbF81fAc2cd41e1d6cF90C6964dAF0E20e1a65";

  beforeAll(() => {
    handleBlock = agent.handleBlock;
  });

  it("No sandwich attack if only 1 tx on uniswap", async () => {
    const blockEvent = generateBlockEvent([
      generateTx(reserveAmount0, reserveAmount1, account1, "50", "0", 30),
    ]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Case: T1 is before Tv, but no T2", async () => {
    // Tv - The transaction from the victim which is detected by the attacker
    const victimTx = generateTx(
      reserveAmount0,
      reserveAmount1,
      account1,
      "500",
      "0",
      200
    );
    // T1 - Attackers frontrunning tx
    const attackerT1 = generateTx(
      reserveAmount0,
      reserveAmount1,
      account2,
      "1000",
      "0",
      700
    );

    const blockEvent = generateBlockEvent([victimTx, attackerT1]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Case: T1 is before TV followed by T2", async () => {
    // Tv - The transaction from the victim which is detected by the attacker
    const victimTx = generateTx(
      reserveAmount0,
      reserveAmount1,
      account1,
      "500",
      "0",
      500
    );
    // T1 - Attackers frontrunning tx
    const attackerT1 = generateTx(
      reserveAmount0,
      reserveAmount1,
      account2,
      "10",
      "0",
      10
    );

    const attackerT2 = generateTx(
      reserveAmount0 + 1000,
      reserveAmount1 - 1000,
      account2,
      "1000",
      "0",
      1100
    );

    const blockEvent = generateBlockEvent([victimTx, attackerT1, attackerT2]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });
});
