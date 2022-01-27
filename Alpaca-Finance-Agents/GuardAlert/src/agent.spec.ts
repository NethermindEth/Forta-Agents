import { HandleBlock } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { createFinding, AddressesRegistry, PriceStatus } from "./utils";
import { when, resetAllWhenMocks } from "jest-when";
import {
  createAddress,
  encodeParameter,
  TestBlockEvent,
} from "forta-agent-tools";
import { isCallToIsStable } from "./mock.utils";

const fetcherMock = jest.fn();
const callMock = jest.fn();
const ethersMock = {
  call: callMock,
  _isProvider: true, // This is necessary for being an ethers provider
} as any;

const workers = [
  createAddress("0x3"),
  createAddress("0x4"),
  createAddress("0x5"),
];

const lpTokens = [createAddress("0x6"), createAddress("0x7")];

const testAddresses: AddressesRegistry = {
  vaults: [
    {
      address: createAddress("0x1"),
      workers: [
        {
          address: workers[0],
          lpToken: lpTokens[0],
        },
        {
          address: workers[1],
          lpToken: lpTokens[0],
        },
      ],
    },
    {
      address: createAddress("0x2"),
      workers: [
        {
          address: workers[2],
          lpToken: lpTokens[1],
        },
      ],
    },
  ],
  workerConfig: createAddress("0x0"),
};

describe("Alpaca Guard Test Suite", () => {
  let handleBlock: HandleBlock;

  beforeAll(() => {
    handleBlock = provideHandleBlock(fetcherMock, "testURL", ethersMock);
  });

  beforeEach(() => {
    resetAllWhenMocks();
    when(fetcherMock)
      .calledWith(expect.anything())
      .mockReturnValue(testAddresses);
  });

  it("should return empty findings if price has not deviated", async () => {
    when(callMock)
      .calledWith(isCallToIsStable(workers[0]), undefined)
      .mockReturnValue(encodeParameter("bool", true));
    when(callMock)
      .calledWith(isCallToIsStable(workers[2]), undefined)
      .mockReturnValue(encodeParameter("bool", true));

    const blockEvent = new TestBlockEvent();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if price has deviated too high", async () => {
    const encodedError = encodeParameter(
      "string",
      "WorkerConfig::isStable:: price too high"
    );

    when(callMock)
      .calledWith(isCallToIsStable(workers[0]), undefined)
      .mockReturnValue(encodeParameter("bool", true));
    when(callMock)
      .calledWith(isCallToIsStable(workers[2]), undefined)
      .mockReturnValue("0x08c379a0" + encodedError.slice(2));

    const blockEvent = new TestBlockEvent();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(lpTokens[1], PriceStatus.HIGH),
    ]);
  });

  it("should return a finding if price has deviated too far down", async () => {
    const encodedError = encodeParameter(
      "string",
      "WorkerConfig::isStable:: price too low"
    );

    when(callMock)
      .calledWith(isCallToIsStable(workers[0]), undefined)
      .mockReturnValue("0x08c379a0" + encodedError.slice(2));
    when(callMock)
      .calledWith(isCallToIsStable(workers[2]), undefined)
      .mockReturnValue(encodeParameter("bool", true));

    const blockEvent = new TestBlockEvent();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(lpTokens[0], PriceStatus.LOW),
    ]);
  });

  it("should return multiple findings if multiple prices have deviated", async () => {
    const encodedErrorHigh = encodeParameter(
      "string",
      "WorkerConfig::isStable:: price too high"
    );
    const encodedErrorLow = encodeParameter(
      "string",
      "WorkerConfig::isStable:: price too low"
    );

    when(callMock)
      .calledWith(isCallToIsStable(workers[0]), undefined)
      .mockReturnValue("0x08c379a0" + encodedErrorHigh.slice(2));
    when(callMock)
      .calledWith(isCallToIsStable(workers[2]), undefined)
      .mockReturnValue("0x08c379a0" + encodedErrorLow.slice(2));

    const blockEvent = new TestBlockEvent();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(lpTokens[0], PriceStatus.HIGH),
      createFinding(lpTokens[1], PriceStatus.LOW),
    ]);
  });
});
