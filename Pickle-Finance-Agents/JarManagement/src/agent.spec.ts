import {
  HandleTransaction,
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import {
  createAddress,
  encodeParameter,
  TestTransactionEvent,
} from "forta-agent-tools";
import { pickleJarInterface } from "./abi";
import { when } from "jest-when";
import {
  isCallToProductionVaults,
  isCallToDevelopmentVaults,
} from "./mock.utils";
import { createFinding } from "./utils";

const pickleRegistryAddress = createAddress("0x0");

const developmentVaults = [createAddress("0x1"), createAddress("0x2")];

const productionVaults = [createAddress("0x3"), createAddress("0x4")];

const mockCall = jest.fn();

const ethersMock = {
  call: mockCall,
  _isProvider: true, // Necessary for being an ethers provider
} as any;

describe("Pickle Finance - Management Functions Test Suite", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      pickleRegistryAddress,
      ethersMock
    );

    when(mockCall)
      .calledWith(isCallToDevelopmentVaults, undefined)
      .mockReturnValue(encodeParameter("address[]", developmentVaults));
    when(mockCall)
      .calledWith(isCallToProductionVaults, undefined)
      .mockReturnValue(encodeParameter("address[]", productionVaults));
  });

  it("should return empty finding if not relevant function is called", async () => {
    const txEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if setMin is call in a Jar", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: developmentVaults[0],
      input: pickleJarInterface.encodeFunctionData("setMin", ["12"]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(developmentVaults[0], "setMin", "12"),
    ]);
  });

  it("should return a finding if setGovernance is call in a Jar", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: developmentVaults[1],
      input: pickleJarInterface.encodeFunctionData("setGovernance", [
        createAddress("0x60"),
      ]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        developmentVaults[1],
        "setGovernance",
        createAddress("0x60")
      ),
    ]);
  });

  it("should return a finding if setTimelock is call in a Jar", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: productionVaults[0],
      input: pickleJarInterface.encodeFunctionData("setTimelock", [
        createAddress("0x13"),
      ]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(productionVaults[0], "setTimelock", createAddress("0x13")),
    ]);
  });

  it("should return a finding if setController is call in a Jar", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: productionVaults[1],
      input: pickleJarInterface.encodeFunctionData("setController", [
        createAddress("0x30"),
      ]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        productionVaults[1],
        "setController",
        createAddress("0x30")
      ),
    ]);
  });

  it("should return a finding if setPaused is call in a Jar", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: developmentVaults[0],
      input: pickleJarInterface.encodeFunctionData("setPaused", [true]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(developmentVaults[0], "setPaused", "true"),
    ]);
  });

  it("should return a finding if setEarnAfterDeposit is call in a Jar", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: developmentVaults[1],
      input: pickleJarInterface.encodeFunctionData("setEarnAfterDeposit", [
        false,
      ]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(developmentVaults[1], "setEarnAfterDeposit", "false"),
    ]);
  });

  it("should detect multiple calls on the same Jar", async () => {
    const txEvent = new TestTransactionEvent().addTraces(
      {
        to: developmentVaults[1],
        input: pickleJarInterface.encodeFunctionData("setEarnAfterDeposit", [
          false,
        ]),
      },
      {
        to: developmentVaults[1],
        input: pickleJarInterface.encodeFunctionData("setMin", ["40"]),
      }
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(developmentVaults[1], "setEarnAfterDeposit", "false"),
      createFinding(developmentVaults[1], "setMin", "40"),
    ]);
  });

  it("should detect relevant calls on different Jars", async () => {
    const txEvent = new TestTransactionEvent().addTraces(
      {
        to: productionVaults[0],
        input: pickleJarInterface.encodeFunctionData("setEarnAfterDeposit", [
          false,
        ]),
      },
      {
        to: developmentVaults[1],
        input: pickleJarInterface.encodeFunctionData("setMin", ["40"]),
      }
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(developmentVaults[1], "setMin", "40"),
      createFinding(productionVaults[0], "setEarnAfterDeposit", "false"),
    ]);
  });

  it("should ignore relevant methods in no Jar contracts", async () => {
    const txEvent = new TestTransactionEvent().addTraces(
      {
        to: createAddress("0x100"),
        input: pickleJarInterface.encodeFunctionData("setEarnAfterDeposit", [
          false,
        ]),
      });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
