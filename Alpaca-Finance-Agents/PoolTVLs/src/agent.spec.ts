import {
  HandleBlock,
} from "forta-agent";
import { provideHandleBlock } from "./agent";
import { TestBlockEvent, createAddress, encodeParameter } from "forta-agent-tools";
import { when, resetAllWhenMocks } from "jest-when";
import { BigNumber } from "ethers";
import { isCallToBalanceOf } from "./mock.utils";
import { createFinding } from "./utils";

const callMock = jest.fn();
const etherMock = {
  call: callMock,
  _isProvider: true // necessary for being an ether provider
} as any;

const principals = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
];

const pools = [
  createAddress("0x10"),
  createAddress("0x11"),
  createAddress("0x12"),
  createAddress("0x13"),
  createAddress("0x14"),
];

const poolInfos = [
  {
    address: pools[0],
    principal: principals[0],
  },
  {
    address: pools[1],
    principal: principals[0],
  },
  {
    address: pools[2],
    principal: principals[1],
  },
  {
    address: pools[3],
    principal: principals[1],
  },
  {
    address: pools[4],
    principal: principals[2],
  },
]

const poolFetcher = jest.fn();


const pricer = jest.fn();


describe("Pool Low TVL Test Suite", () => {
  let handleBlock: HandleBlock;

  beforeEach(() => {
    resetAllWhenMocks();
    handleBlock = provideHandleBlock(poolFetcher, pricer, "test", 10, BigNumber.from(20000), etherMock);
    poolFetcher.mockReturnValue(poolInfos);

  });

  it("should return empty findings if all the pools have enough liquidity", async () => {
    // Amounts of principal in pools
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[0]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[1]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[2]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[3]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[2], pools[4]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));

    // Prices for principal
    when(pricer).calledWith(expect.anything(), principals[0], expect.anything(), expect.anything()).mockReturnValue(100);
    when(pricer).calledWith(expect.anything(), principals[1], expect.anything(), expect.anything()).mockReturnValue(100);
    when(pricer).calledWith(expect.anything(), principals[2], expect.anything(), expect.anything()).mockReturnValue(100);

    const blockEvent = new TestBlockEvent().setNumber(10);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if a pool has low liquidity", async () => {
    // Amounts of principal in pools
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[0]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[1]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[2]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[3]), expect.anything()).mockReturnValue(encodeParameter("uint256", 200));
    when(callMock).calledWith(isCallToBalanceOf(principals[2], pools[4]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));

    // Prices for principal
    when(pricer).calledWith(expect.anything(), principals[0], expect.anything(), expect.anything()).mockReturnValue(100);
    when(pricer).calledWith(expect.anything(), principals[1], expect.anything(), expect.anything()).mockReturnValue(50);
    when(pricer).calledWith(expect.anything(), principals[2], expect.anything(), expect.anything()).mockReturnValue(100);

    const blockEvent = new TestBlockEvent().setNumber(10);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([ createFinding(pools[2], "10000") ]);
  });

  it("should return multiple findings if multiple pools have low liquidity", async () => {
    // Amounts of principal in pools
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[0]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[1]), expect.anything()).mockReturnValue(encodeParameter("uint256", 10));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[2]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[3]), expect.anything()).mockReturnValue(encodeParameter("uint256", 200));
    when(callMock).calledWith(isCallToBalanceOf(principals[2], pools[4]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));

    // Prices for principal
    when(pricer).calledWith(expect.anything(), principals[0], expect.anything(), expect.anything()).mockReturnValue(100);
    when(pricer).calledWith(expect.anything(), principals[1], expect.anything(), expect.anything()).mockReturnValue(50);
    when(pricer).calledWith(expect.anything(), principals[2], expect.anything(), expect.anything()).mockReturnValue(100);

    const blockEvent = new TestBlockEvent().setNumber(10);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([ createFinding(pools[1], "2000"), createFinding(pools[2], "10000") ]);
  });

  it("should ignore block that are too close", async () => {
    // Amounts of principal in pools
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[0]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[0], pools[1]), expect.anything()).mockReturnValue(encodeParameter("uint256", 10));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[2]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));
    when(callMock).calledWith(isCallToBalanceOf(principals[1], pools[3]), expect.anything()).mockReturnValue(encodeParameter("uint256", 200));
    when(callMock).calledWith(isCallToBalanceOf(principals[2], pools[4]), expect.anything()).mockReturnValue(encodeParameter("uint256", 100));

    // Prices for principal
    when(pricer).calledWith(expect.anything(), principals[0], expect.anything(), expect.anything()).mockReturnValue(100);
    when(pricer).calledWith(expect.anything(), principals[1], expect.anything(), expect.anything()).mockReturnValue(50);
    when(pricer).calledWith(expect.anything(), principals[2], expect.anything(), expect.anything()).mockReturnValue(100);

    let blockEvent = new TestBlockEvent().setNumber(10);
    let findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([ createFinding(pools[1], "2000"), createFinding(pools[2], "10000") ]);

    blockEvent = new TestBlockEvent().setNumber(15);
    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });
});
