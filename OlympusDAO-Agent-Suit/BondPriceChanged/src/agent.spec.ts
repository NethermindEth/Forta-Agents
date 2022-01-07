import { HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import {
  TestTransactionEvent,
  createAddress,
  encodeParameter,
} from "forta-agent-tools";
import { createFinding } from "./utils";
import { redeemHelperInterface } from "./abi";
import { providers } from "ethers";
import { when } from "jest-when";

const EVENT_ABI = "BondPriceChanged(uint256,uint256,uint256)";
const REDEEM_HELPER_ADDRESS = createAddress("0x1");
const BONDS_ADDRESSES = [
  createAddress("0x2"),
  createAddress("0x3"),
  createAddress("0x4"),
  createAddress("0x5"),
  createAddress("0x6"),
];

describe("ControlVariableAdjustment Agent Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let ethersMock: providers.Provider;
  let callMock: jest.Mock<any, any>;
  let getStorageMock: jest.Mock<any, any>;

  beforeAll(() => {
    callMock = jest.fn();
    getStorageMock = jest.fn();
    ethersMock = {
      call: callMock,
      getStorageAt: getStorageMock,
      _isProvider: true, // Necessary for ethers accepting the mock as Provider
    } as any;
    handleTransaction = provideHandleTransaction(
      REDEEM_HELPER_ADDRESS,
      ethersMock
    );
  });

  it("should return empty findings if not relevant event was emitted", async () => {
    when(getStorageMock)
      .calledWith(expect.anything(), expect.anything(), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));

    const txEvent = new TestTransactionEvent().setBlock(1);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if relevant event is emitted from bond contract", async () => {
    when(getStorageMock)
      .calledWith(expect.anything(), expect.anything(), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 1));

    BONDS_ADDRESSES.forEach((value, index) => {
      when(callMock)
        .calledWith(
          {
            data: redeemHelperInterface.encodeFunctionData("bonds", [index]),
            to: REDEEM_HELPER_ADDRESS,
          },
          expect.anything()
        )
        .mockResolvedValue(encodeParameter("address", value));
    });

    const txEvent = new TestTransactionEvent()
      .setBlock(2)
      .addEventLog(
        EVENT_ABI,
        BONDS_ADDRESSES[0],
        "0x",
        encodeParameter("uint256", 12),
        encodeParameter("uint256", 11),
        encodeParameter("uint256", 10)
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding("12", "11", "10")]);
  });

  it("should return empty findings if relevant event is emitted from no bond contracts", async () => {
    when(getStorageMock)
      .calledWith(expect.anything(), expect.anything(), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 2));

    BONDS_ADDRESSES.forEach((value, index) => {
      when(callMock)
        .calledWith(
          {
            data: redeemHelperInterface.encodeFunctionData("bonds", [index]),
            to: REDEEM_HELPER_ADDRESS,
          },
          expect.anything()
        )
        .mockResolvedValue(encodeParameter("address", value));
    });

    const txEvent = new TestTransactionEvent()
      .setBlock(3)
      .addEventLog(
        EVENT_ABI,
        BONDS_ADDRESSES[2],
        "0x",
        encodeParameter("uint256", 12),
        encodeParameter("uint256", 11),
        encodeParameter("uint256", 10)
      )
      .addEventLog(
        EVENT_ABI,
        createAddress("0x12"),
        "0x",
        encodeParameter("uint256", 12),
        encodeParameter("uint256", 11),
        encodeParameter("uint256", 10)
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings when relevant events are emitted from bond contracts", async () => {
    when(getStorageMock)
      .calledWith(expect.anything(), expect.anything(), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 4));

    BONDS_ADDRESSES.forEach((value, index) => {
      when(callMock)
        .calledWith(
          {
            data: redeemHelperInterface.encodeFunctionData("bonds", [index]),
            to: REDEEM_HELPER_ADDRESS,
          },
          expect.anything()
        )
        .mockResolvedValue(encodeParameter("address", value));
    });

    const txEvent = new TestTransactionEvent()
      .setBlock(4)
      .addEventLog(
        EVENT_ABI,
        BONDS_ADDRESSES[0],
        "0x",
        encodeParameter("uint256", 12),
        encodeParameter("uint256", 11),
        encodeParameter("uint256", 10)
      )
      .addEventLog(
        EVENT_ABI,
        BONDS_ADDRESSES[3],
        "0x",
        encodeParameter("uint256", 2),
        encodeParameter("uint256", 1),
        encodeParameter("uint256", 0)
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding("12", "11", "10"),
      createFinding("2", "1", "0"),
    ]);
  });
});
