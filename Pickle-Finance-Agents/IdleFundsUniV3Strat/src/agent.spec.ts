import { HandleBlock } from "forta-agent";
import { provideHandleBlock } from "./agent";
import {
  TestBlockEvent,
  createAddress,
  encodeParameter,
} from "forta-agent-tools";
import {
  isCallToStrategyArray,
  isCallToLiquidityOf,
  isCallToLiquidityOfThis,
} from "./mock.utils";
import { when, resetAllWhenMocks } from "jest-when";
import { createFinding } from "./utils";

const keeperAddress = createAddress("0x1");
const strategies = [createAddress("0x2"), createAddress("0x3")];

const callMock = jest.fn();
const getStorageAtMock = jest.fn();

const ethersMock = {
  call: callMock,
  getStorageAt: getStorageAtMock,
  _isProvider: true, // Necessary for mocking an ether provider
} as any;


describe("UniV3 Strategy Idle Funds Test Suite", () => {
  let handleBlock: HandleBlock;

  beforeAll(() => {
    handleBlock = provideHandleBlock(keeperAddress, 30, ethersMock);
  });

  beforeEach(() => {
    resetAllWhenMocks();
    when(getStorageAtMock)
      .calledWith(expect.anything(), expect.anything(), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 2));
    when(callMock)
      .calledWith(isCallToStrategyArray(0), expect.anything())
      .mockReturnValue(encodeParameter("address", strategies[0]));
    when(callMock)
      .calledWith(isCallToStrategyArray(1), expect.anything())
      .mockReturnValue(encodeParameter("address", strategies[1]));
  });

  it("should return empty findings if idle funds are zero", async () => {
    const blockEvent = new TestBlockEvent();
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10000));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if a strategy has too much idle funds", async () => {
    const blockEvent = new TestBlockEvent();
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10000));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 6000));

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(strategies[1], "60")]);
  });

  it("should only take in account UniV3 strategies", async () => {
    const blockEvent = new TestBlockEvent();
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 10000));
    when(callMock)
      .calledWith(
        isCallToLiquidityOf(createAddress("0x1234")),
        expect.anything()
      )
      .mockReturnValue(encodeParameter("uint256", 10));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));
    when(callMock)
      .calledWith(
        isCallToLiquidityOfThis(createAddress("0x1234")),
        expect.anything()
      )
      .mockReturnValue(encodeParameter("uint256", 8));

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should check all the strategies", async () => {
    const blockEvent = new TestBlockEvent();
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToLiquidityOf(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 200));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 40));
    when(callMock)
      .calledWith(isCallToLiquidityOfThis(strategies[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 100));

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(strategies[0], "40"),
      createFinding(strategies[1], "50"),
    ]);
  });
});
