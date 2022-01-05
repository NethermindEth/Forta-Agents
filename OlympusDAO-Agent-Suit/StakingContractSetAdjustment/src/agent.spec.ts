import {
  HandleTransaction,
} from "forta-agent";
import { provideHandleTransaction, FUNCTION_ABI } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { utils } from "ethers";
import { createFinding } from "./utils";

describe("SetAdjustment Agent Test Suite", () => {
  let stakeContractAddress: string;
  let handleTransaction: HandleTransaction;
  let contractInterface: utils.Interface;

  beforeAll(() => {
    stakeContractAddress = createAddress("0x1");
    handleTransaction = provideHandleTransaction(stakeContractAddress);
    contractInterface = new utils.Interface([FUNCTION_ABI]);
  });

  it("should returns empty findings the function was not called", async () => {
    const txEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding the method was called in the stake contract", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: stakeContractAddress,
      input: contractInterface.encodeFunctionData("setAdjustment", [
        1,
        true,
        2,
        10,
      ]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding("1", "true", "2", "10")]);
  });

  it("should ignore method call if it was called in other contract", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: createAddress("0x2"),
      input: contractInterface.encodeFunctionData("setAdjustment", [
        1,
        true,
        2,
        10,
      ]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should report multiple calls to the function", async () => {
    const txEvent = new TestTransactionEvent().addTraces(
      {
        to: stakeContractAddress,
        input: contractInterface.encodeFunctionData("setAdjustment", [
          2,
          false,
          2,
          20,
        ]),
      },
      {
        to: stakeContractAddress,
        input: contractInterface.encodeFunctionData("setAdjustment", [
          6,
          true,
          1,
          15,
        ]),
      }
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding("2", "false", "2", "20"),
      createFinding("6", "true", "1", "15"),
    ]);
  });

  it("should report only calls to the function on the correct contract", async () => {
    const txEvent = new TestTransactionEvent().addTraces(
      {
        to: stakeContractAddress,
        input: "0xbad",
      },
      {
        to: stakeContractAddress,
        input: contractInterface.encodeFunctionData("setAdjustment", [
          6,
          true,
          1,
          15,
        ]),
      },
      {
        to: stakeContractAddress,
        input: contractInterface.encodeFunctionData("setAdjustment", [
          3,
          false,
          2,
          23,
        ]),
      },
      {
        to: createAddress("0x32"),
        input: contractInterface.encodeFunctionData("setAdjustment", [
          1,
          false,
          1,
          12,
        ]),
      }
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding("6", "true", "1", "15"),
      createFinding("3", "false", "2", "23"),
    ]);
  });
});
