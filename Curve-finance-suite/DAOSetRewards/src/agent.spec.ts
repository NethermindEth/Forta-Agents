import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools";
import { gaugeInterface } from "./abi";
import { keccak256 } from "forta-agent/dist/sdk/utils";

const createFinding = (
  to: string,
  rewardContract: string,
  sigs: string,
  rewardTokens: string[]
): Finding => {
  return Finding.fromObject({
    name: "DAO Set Gauge Rewards",
    description: "Curve DAO try to set Gauge Rewards Options",
    alertId: "CURVE-11",
    protocol: "Curve Finance",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      gauge: to,
      rewardContract: rewardContract,
      sigs: sigs,
      rewardToken: rewardTokens.toString(),
    },
  });
};

const daoAddress = createAddress("0x1");
const callArguments1 = [
  createAddress("0x3"),
  keccak256("test"),
  Array.from("12345678", (item: string) => createAddress(`0x${item}`)),
];
const callArguments2 = [
  createAddress("0x4"),
  keccak256("test"),
  Array.from("12345678", (item: string) => createAddress(`0x${item}`)),
];

describe("Curve DAO Set Gauge Rewards Test Suite", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(daoAddress);
  });

  it("should return empty findings because of non relevant transactions", async () => {
    const txEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if set_rewards is called from dao", async () => {
    const gaugeAddress = createAddress("0x2");

    const txEvent = new TestTransactionEvent().addTraces({
      to: gaugeAddress,
      from: daoAddress,
      input: gaugeInterface.encodeFunctionData("set_rewards", callArguments1),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        gaugeAddress,
        callArguments1[0] as string,
        callArguments1[1] as string,
        callArguments1[2] as string[]
      ),
    ]);
  });

  it("should return empty findings if set_rewards is not called from dao", async () => {
    const gaugeAddress = createAddress("0x2");

    const txEvent = new TestTransactionEvent().addTraces({
      to: gaugeAddress,
      from: createAddress("0x12"),
      input: gaugeInterface.encodeFunctionData("set_rewards", callArguments1),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings if set_rewards is called multiple times from dao", async () => {
    const gaugeAddress = createAddress("0x2");

    const txEvent = new TestTransactionEvent()
      .addTraces({
        to: gaugeAddress,
        from: daoAddress,
        input: gaugeInterface.encodeFunctionData("set_rewards", callArguments1),
      })
      .addTraces({
        to: gaugeAddress,
        from: daoAddress,
        input: gaugeInterface.encodeFunctionData("set_rewards", callArguments2),
      });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        gaugeAddress,
        callArguments1[0] as string,
        callArguments1[1] as string,
        callArguments1[2] as string[]
      ),
      createFinding(
        gaugeAddress,
        callArguments2[0] as string,
        callArguments2[1] as string,
        callArguments2[2] as string[]
      ),
    ]);
  });
});
