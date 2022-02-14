import { HandleTransaction, TransactionEvent } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import {
  TestTransactionEvent,
  createAddress,
  encodeParameter,
  encodeParameters,
} from "forta-agent-tools";
import { when } from "jest-when";
import { isCallToGetUpkeep, isCallToGetMinBalance } from "./mock.utils";
import { keeperRegistryInterface } from "./abi";
import { createHighFinding, createInfoFinding } from "./utils";

const keeperRegistryAddress = createAddress("0x1");
const zeroAddress = createAddress("0x0");

const callMock = jest.fn();
const ethersMock = {
  call: callMock,
  _isProvider: true, // Necessary for mocking ethers provider
} as any;

describe("Keeper Topup Monitor Test Suite", () => {
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(
      10,
      25,
      3,
      keeperRegistryAddress,
      28,
      ethersMock
    );
  });

  it("should return empty findings if performUpkeep was not call", async () => {
    let txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "12"; // Necessary because forta-agent-tools doesn't support setting gas price yet

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an Info finding is the estimated remaining calls are below info threshold and above high threshold", async () => {
    let txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "12"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    let findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "14"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    when(callMock)
      .calledWith(isCallToGetMinBalance, expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10));
    when(callMock)
      .calledWith(isCallToGetUpkeep, expect.anything())
      .mockReturnValue(
        encodeParameters(
          [
            "address",
            "uint32",
            "bytes",
            "uint96",
            "address",
            "address",
            "uint64",
          ],
          [zeroAddress, 5, zeroAddress, 780, zeroAddress, zeroAddress, 0]
        )
      );

    txEvent.setBlock(2).addTraces({
      to: keeperRegistryAddress,
      input: keeperRegistryInterface.encodeFunctionData("performUpkeep", [
        28,
        zeroAddress,
      ]),
    });

    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createInfoFinding("11", "780")]);
  });

  it("should return an High finding is the estimated remaining calls are below high threshold", async () => {
    let txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "12"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    let findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "14"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    when(callMock)
      .calledWith(isCallToGetMinBalance, expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10));
    when(callMock)
      .calledWith(isCallToGetUpkeep, expect.anything())
      .mockReturnValue(
        encodeParameters(
          [
            "address",
            "uint32",
            "bytes",
            "uint96",
            "address",
            "address",
            "uint64",
          ],
          [zeroAddress, 5, zeroAddress, 180, zeroAddress, zeroAddress, 0]
        )
      );

    txEvent.setBlock(2).addTraces({
      to: keeperRegistryAddress,
      input: keeperRegistryInterface.encodeFunctionData("performUpkeep", [
        28,
        zeroAddress,
      ]),
    });

    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createHighFinding("2", "180")]);
  });

  it("should not return more than one finding per block", async () => {
    let txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "12"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    let findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "14"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    when(callMock)
      .calledWith(isCallToGetMinBalance, expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10));
    when(callMock)
      .calledWith(isCallToGetUpkeep, expect.anything())
      .mockReturnValue(
        encodeParameters(
          [
            "address",
            "uint32",
            "bytes",
            "uint96",
            "address",
            "address",
            "uint64",
          ],
          [zeroAddress, 5, zeroAddress, 180, zeroAddress, zeroAddress, 0]
        )
      );

    txEvent = new TestTransactionEvent().setBlock(2).addTraces({
      to: keeperRegistryAddress,
      input: keeperRegistryInterface.encodeFunctionData("performUpkeep", [
        28,
        zeroAddress,
      ]),
    });
    txEvent.transaction.gasPrice = "14";

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createHighFinding("2", "180")]);

    txEvent = new TestTransactionEvent().setBlock(2).addTraces({
      to: keeperRegistryAddress,
      input: keeperRegistryInterface.encodeFunctionData("performUpkeep", [
        28,
        zeroAddress,
      ]),
    });
    txEvent.transaction.gasPrice = "14";

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should only emit findings when the correct keeper is called", async () => {
    let txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "12"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    let findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "14"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    when(callMock)
      .calledWith(isCallToGetMinBalance, expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10));
    when(callMock)
      .calledWith(isCallToGetUpkeep, expect.anything())
      .mockReturnValue(
        encodeParameters(
          [
            "address",
            "uint32",
            "bytes",
            "uint96",
            "address",
            "address",
            "uint64",
          ],
          [zeroAddress, 5, zeroAddress, 180, zeroAddress, zeroAddress, 0]
        )
      );

    txEvent = new TestTransactionEvent().setBlock(2).addTraces({
      to: keeperRegistryAddress,
      input: keeperRegistryInterface.encodeFunctionData("performUpkeep", [
        26,
        zeroAddress,
      ]),
    });
    txEvent.transaction.gasPrice = "14";

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should emit empty findings if the actual balance is enough", async () => {
    let txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "12"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    let findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = new TestTransactionEvent().setBlock(1);
    txEvent.transaction.gasPrice = "14"; // Necessary because forta-agent-tools doesn't support setting gas price yet
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    when(callMock)
      .calledWith(isCallToGetMinBalance, expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10));
    when(callMock)
      .calledWith(isCallToGetUpkeep, expect.anything())
      .mockReturnValue(
        encodeParameters(
          [
            "address",
            "uint32",
            "bytes",
            "uint96",
            "address",
            "address",
            "uint64",
          ],
          [zeroAddress, 5, zeroAddress, 1800, zeroAddress, zeroAddress, 0]
        )
      );

    txEvent = new TestTransactionEvent().setBlock(2).addTraces({
      to: keeperRegistryAddress,
      input: keeperRegistryInterface.encodeFunctionData("performUpkeep", [
        28,
        zeroAddress,
      ]),
    });
    txEvent.transaction.gasPrice = "14";

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
