import { Finding, HandleBlock, HandleTransaction } from "forta-agent";
import {
  encodeFunctionSignature,
  TestBlockEvent,
  TestTransactionEvent
} from "forta-agent-tools";
import { BlockEvent } from "forta-agent-tools/node_modules/forta-agent";
import { provideHandleTransaction, provideMakerStrategyHandler } from "./agent";
import { createAddress } from "forta-agent-tools";
import Mock, { Args } from "./mock/mock";
import {
  createFindingIsUnderWater,
  createFindingLowWater,
  createFindingHighWater,
  createFindingStabilityFee,
  JUG_DRIP_FUNCTION_SIGNATURE
} from "./utils";

const poolAccountants = [createAddress("0x0"), createAddress("0x1")];

const createMock = (...args: Args) => {
  return {
    eth: {
      Contract: Mock.build_Mock(args)
    }
  } as any;
};

describe("Vesper Maker Strategy Agent Test Suite", () => {
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;

  it("should return empty findings if isUnderWater=False", async () => {
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2600000000000000000";

    const mockWeb3 = createMock(
      poolAccountants,
      false,
      {
        collateralRatio: "2516557646144049203"
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker"
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = [...(await handleBlock(blockEvent))];
    expect(findings).toStrictEqual([]);
  });

  it("should return 2 findings because of collateral ratio > high water", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";

    const mockWeb3 = createMock(
      poolAccountants,
      false,
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker"
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFindingHighWater(
        Mock.STRATEGIES_V2.toString(),
        COLLATERAL_RATIO,
        HIGH_WATER
      ),
      createFindingHighWater(
        Mock.STRATEGIES_V3.toString(),
        COLLATERAL_RATIO,
        HIGH_WATER
      )
    ]);
  });

  it("should return findings because of collateral ratio < low water", async () => {
    const COLLATERAL_RATIO = "2116557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";

    const mockWeb3 = createMock(
      poolAccountants,
      false,
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker"
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFindingLowWater(
        Mock.STRATEGIES_V2.toString(),
        COLLATERAL_RATIO,
        LOW_WATER
      ),
      createFindingLowWater(
        Mock.STRATEGIES_V3.toString(),
        COLLATERAL_RATIO,
        LOW_WATER
      )
    ]);
  });

  it("should return findings because of isUnderWater=True", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2600000000000000000";

    const mockWeb3 = createMock(
      poolAccountants,
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker"
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFindingIsUnderWater(Mock.STRATEGIES_V2.toString()),
      createFindingIsUnderWater(Mock.STRATEGIES_V3.toString())
    ]);
  });

  it("should return empty findings if no Maker name included", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";

    const mockWeb3 = createMock(
      poolAccountants,
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "UniSwap"
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return 2 TYPE findings because of isUnderWater=True and collateral ratio < low water", async () => {
    const COLLATERAL_RATIO = "2416557646144049203";
    const LOW_WATER = "2500000000000000000";
    const HIGH_WATER = "2600000000000000000";

    const mockWeb3 = createMock(
      poolAccountants,
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker"
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFindingIsUnderWater(Mock.STRATEGIES_V2.toString()),
      createFindingLowWater(
        Mock.STRATEGIES_V2.toString(),
        COLLATERAL_RATIO,
        LOW_WATER
      ),
      createFindingIsUnderWater(Mock.STRATEGIES_V3.toString()),
      createFindingLowWater(
        Mock.STRATEGIES_V3.toString(),
        COLLATERAL_RATIO,
        LOW_WATER
      )
    ]);
  });

  it("should return 2 TYPE findings because of isUnderWater=True and collateral ratio > high water", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";

    const mockWeb3 = createMock(
      poolAccountants,
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker"
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFindingIsUnderWater(Mock.STRATEGIES_V2.toString()),
      createFindingHighWater(
        Mock.STRATEGIES_V2.toString(),
        COLLATERAL_RATIO,
        HIGH_WATER
      ),
      createFindingIsUnderWater(Mock.STRATEGIES_V3.toString()),
      createFindingHighWater(
        Mock.STRATEGIES_V3.toString(),
        COLLATERAL_RATIO,
        HIGH_WATER
      )
    ]);
  });

  it("should return finding if stability fee changed in specific strategy", async () => {
    const selector = encodeFunctionSignature(JUG_DRIP_FUNCTION_SIGNATURE);
    const collateralType =
      "4554482d43000000000000000000000000000000000000000000000000000000";

    const INPUT = selector + collateralType;

    const mockWeb3 = createMock(
      poolAccountants,
      false,
      {
        collateralRatio: "2516557646144049203"
      },
      "2200000000000000000",
      "2500000000000000000",
      "Maker"
    );

    handleTransaction = provideHandleTransaction(mockWeb3);

    const txnEvent = new TestTransactionEvent().addTraces({
      input: INPUT
    });

    let findings: Finding[];
    findings = await handleTransaction(txnEvent);

    expect(findings).toStrictEqual([
      createFindingStabilityFee(Mock.STRATEGIES_V2.toString()),
      createFindingStabilityFee(Mock.STRATEGIES_V3.toString())
    ]);
  });

  it("should return empty finding if stability fee changed in non-maker strategy", async () => {
    const selector = encodeFunctionSignature(JUG_DRIP_FUNCTION_SIGNATURE);
    const collateralType =
      "3554482d43000000000000000000000000000000000000000000000000000000"; // bad collateral type

    const INPUT = selector + collateralType;

    const mockWeb3 = createMock(
      poolAccountants,
      false,
      {
        collateralRatio: "2516557646144049203"
      },
      "2200000000000000000",
      "2500000000000000000",
      "Maker"
    );

    handleTransaction = provideHandleTransaction(mockWeb3);

    const txnEvent = new TestTransactionEvent().addTraces({
      input: INPUT
    });

    let findings: Finding[];
    findings = await handleTransaction(txnEvent);

    expect(findings).toStrictEqual([]);
  });
});
