import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  getJsonRpcUrl,
} from "forta-agent";
import agent, { token0Contract, token1Contract } from ".";
import Web3 from "web3";
const web3 = new Web3(getJsonRpcUrl());

import { swapTokensForExactTokens as swap } from "./router";
import { generateBlockEvent } from "./utils";

const generateTx = (
  amountOut: string,
  amountInMAx: string,
  calldata: string[],
  address: string,
  deadline: string
) => {
  const signFunctionTx = web3.eth.abi.encodeFunctionCall(swap as any, [
    amountOut,
    amountInMAx,
    // @ts-ignore
    calldata,
    address,
    deadline,
  ]);

  return signFunctionTx;
};

describe("Agent for SandWich Attack", () => {
  let handleBlock: HandleBlock;

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const account1 = "0xf2AfC6F347C3791cBBFe75248DBA18d719026b23";
  const account2 = "0x4FAbF81fAc2cd41e1d6cF90C6964dAF0E20e1a65";

  beforeAll(() => {
    handleBlock = agent.handleBlock;
  });

  it("No sandwich attack if only 1 tx on uniswap", async () => {
    const blockEvent = generateBlockEvent([
      generateTx("50", "0", [zeroAddress], account1, "0"),
    ]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Case: T1 is before Tv, but no T2", async () => {
    // Tv - The transaction from the victim which is detected by the attacker
    const victimTx = generateTx("500", "0", [zeroAddress], account1, "0");
    // T1 - Attackers frontrunning tx
    const attackerT1 = generateTx("1000", "0", [zeroAddress], account2, "0");

    const blockEvent = generateBlockEvent([victimTx, attackerT1]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Case: T1 is before TV followed by T2, but amount used is not too massive by attacker", async () => {
    // Tv - The transaction from the victim which is detected by the attacker
    const victimTx = generateTx("10", "11", [zeroAddress], account1, "0");
    // T1 - Attackers frontrunning tx
    const attackerT1 = generateTx("1000", "1100", [zeroAddress], account2, "0");

    // this is v2 : nor required for agent detection but included since its a crucial part of the attack
    const attackerT2 = generateTx("1000", "1000", [zeroAddress], account2, "0");

    const blockEvent = generateBlockEvent([attackerT1, victimTx, attackerT2]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Case: T1 is before TV followed by T2 , and the mev conditions are met: Red Alert", async () => {
    // T1 - Attackers frontrunning tx
    const attackerT1 = generateTx(
      "1000",
      "1000000",
      [zeroAddress],
      account2,
      "0"
    );

    let r1 = await token0Contract.methods
      .balanceOf("0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f")
      .call(); // token0 reserves
    r1 /= 10 ** 6;
    let r2 = await token1Contract.methods
      .balanceOf("0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f")
      .call(); // token1 reserves
    r2 /= 10 ** 6;

    const x = 1000,
      v = 500;

    // Refer : https://pub.tik.ee.ethz.ch/students/2021-FS/BA-2021-07.pdf
    const attackableValue =
      (v * 0.997 * (r2 - (x * 0.997 * r2) / (r1 + 0.997 * x))) /
      (r1 + x + 0.997 * v);

    // Tv - The transaction from the victim which is detected by the attacker
    const victimTx = generateTx(
      "500",
      parseInt(attackableValue.toString()).toString(),
      [zeroAddress],
      account1,
      "0"
    );
    // this is v2 : nor required for agent detection but included since its a crucial part of the attack
    const attackerT2 = generateTx("520", "0", [zeroAddress], account2, "0");

    const blockEvent = generateBlockEvent([attackerT1, victimTx, attackerT2]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "MEV Attack Detected",
        description: `Block number ${blockEvent.blockNumber} detected MEV attack`,
        alertId: "NETHFORTA-20",
        severity: FindingSeverity.High,
        type: FindingType.Exploit,
        metadata: {
          x: "1000",
          v: "500",
          m: parseInt(attackableValue.toString()).toString(),
        },
      }),
    ]);
  });
});
