import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleBlock,
  HandleTransaction
} from "forta-agent";
import {
  encodeFunctionSignature,
  TestBlockEvent,
  TestTransactionEvent,
  encodeParameter
} from "forta-agent-tools";
import { BlockEvent } from "forta-agent-tools/node_modules/forta-agent";
import { provideHandleTransaction, provideMakerStrategyHandler, setCacheTime } from "./agent";
import { createAddress } from "forta-agent-tools";
import Mock, { Args } from "./mock/mock";
import {
  createFindingIsUnderWater,
  createFindingLowWater,
  createFindingHighWater,
  JUG_CHANGE_BASE_FUNCTION_SIGNATURE,
  JUG_CHANGE_DUTY_FUNCTION_SIGNAUTRE,
  JUG_CONTRACT
} from "./utils";
import TimeTracker from './time.tracker';
const axios = require('axios');
jest.mock('axios');

const createMock = (...args: Args) => {
  return {
    eth: {
      Contract: Mock.build_Mock(args)
    }
  } as any;
};

const createFindingSF = (
  _strategy: string,
  collateralType: string,
  newDuty: string
): Finding => {
  return Finding.fromObject({
    name: "Stability Fee Update Detection",
    description: "stability Fee is changed for related strategy's collateral",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "Vesper-1-3",
    protocol: "Vesper",
    metadata: {
      strategy: _strategy,
      collateralType: collateralType,
      newDuty: newDuty,
    }
  });
};

const createFindingSFB = (
  newBase: string,
): Finding => {
  return Finding.fromObject({
    name: "Stability Fee Update Detection",
    description: "Base stability Fee changed",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "Vesper-1-4",
    protocol: "Vesper",
    metadata: {
      newBase: newBase,
    }
  });
};
const threshold: number = 1000;

function mockPool() {
  const poolAddress = createAddress("0x2")
  const pools = {
    data: {
      pools: [
        {
          contract: {
            address: poolAddress,
            version : "2.x"
          },
          status: "operative",
          stage: "prod",
        },
        {
          contract: {
            address: poolAddress,
            version : "3.x"
          },
          status: "operative",
          stage: "prod",
        },
      ],
    },
  } as any;
  (axios.get as jest.Mock).mockResolvedValue(pools);
}

describe("Vesper Maker Strategy Agent Test Suite", () => {
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;
  const tracker: TimeTracker = new TimeTracker();  
  beforeEach(() => {
    setCacheTime(0)
    mockPool()
  });

  xit("should return empty findings if isUnderWater=False", async () => {
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2600000000000000000";

    const mockWeb3 = createMock(
      false,
      {
        collateralRatio: "2516557646144049203"
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker",
      1,
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = [...(await handleBlock(blockEvent))];
    expect(findings).toStrictEqual([]);
  });

  xit("should return 2 findings because of collateral ratio > high water", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";

    const mockWeb3 = createMock(
      false,
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker",
      1,
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

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

  it("should return 0 findings because strategies are blank", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";

    const mockWeb3 = createMock(
      false,
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker",
      0,
    );
    
    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings because of collateral ratio < low water", async () => {
    const COLLATERAL_RATIO = "2116557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";
    
    const mockWeb3 = createMock(
      false,
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker",
      1,
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

    let findings: Finding[] = [];

    const startBlock = 2000;
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(startBlock)
      .setNumber(10);
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
  

  xit("should return findings because of isUnderWater=True", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2600000000000000000";

    const mockWeb3 = createMock(
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker",
      1,
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

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
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "UniSwap",
      1,
    );
    
    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  xit("should return 2 TYPE findings because of isUnderWater=True and collateral ratio < low water", async () => {
    const COLLATERAL_RATIO = "2416557646144049203";
    const LOW_WATER = "2500000000000000000";
    const HIGH_WATER = "2600000000000000000";

    const mockWeb3 = createMock(
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker",
      1,
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

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

  xit("should return 2 TYPE findings because of isUnderWater=True and collateral ratio > high water", async () => {
    const COLLATERAL_RATIO = "2516557646144049203";
    const LOW_WATER = "2200000000000000000";
    const HIGH_WATER = "2500000000000000000";

    const mockWeb3 = createMock(
      true, // isUnderWater
      {
        collateralRatio: COLLATERAL_RATIO
      },
      LOW_WATER,
      HIGH_WATER,
      "Maker",
      1,
    );

    handleBlock = provideMakerStrategyHandler(mockWeb3, threshold, tracker);

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

  it("should return finding if stability fee changed in specific strategy", async () => {
    const selector = encodeFunctionSignature(JUG_CHANGE_DUTY_FUNCTION_SIGNAUTRE);
    const what = "6475747900000000000000000000000000000000000000000000000000000000" // "duty" in bytes32
    const collateralType =
      "4554482d43000000000000000000000000000000000000000000000000000000";

    const INPUT = selector + what + collateralType + encodeParameter("uint256", 1245).slice(2);

    const mockWeb3 = createMock(
      false,
      {
        collateralRatio: "2516557646144049203"
      },
      "2200000000000000000",
      "2500000000000000000",
      "Maker",
      1,
    );
    

    handleTransaction = provideHandleTransaction(mockWeb3);

    const txnEvent = new TestTransactionEvent().addTraces({
      to: JUG_CONTRACT,
      input: INPUT
    });

    let findings: Finding[];
    findings = await handleTransaction(txnEvent);

    expect(findings).toStrictEqual([
      createFindingSF(Mock.STRATEGIES_V2.toString(), "0x" + collateralType, "1245"),
      createFindingSF(Mock.STRATEGIES_V3.toString(), "0x" + collateralType, "1245")
    ]);
  });

  it("should return finding if base fee changed", async () => {
    const selector = encodeFunctionSignature(JUG_CHANGE_BASE_FUNCTION_SIGNATURE);
    const what = "6261736500000000000000000000000000000000000000000000000000000000" // "base" in bytes32

    const INPUT = selector + what + encodeParameter("uint256", 1245).slice(2);

    const mockWeb3 = createMock(
      false,
      {
        collateralRatio: "2516557646144049203"
      },
      "2200000000000000000",
      "2500000000000000000",
      "Maker",
      1,
    );
    

    handleTransaction = provideHandleTransaction(mockWeb3);

    const txnEvent = new TestTransactionEvent().addTraces({
      to: JUG_CONTRACT,
      input: INPUT
    });

    let findings: Finding[];
    findings = await handleTransaction(txnEvent);

    expect(findings).toStrictEqual([
      createFindingSFB("1245"),
    ]);
  });

  it("should return empty finding if stability fee changed in non-maker strategy", async () => {
    const selector = encodeFunctionSignature(JUG_CHANGE_DUTY_FUNCTION_SIGNAUTRE);
    const what = "6475747900000000000000000000000000000000000000000000000000000000" // "duty" in bytes32
    const collateralType =
      "3554482d43000000000000000000000000000000000000000000000000000000"; // bad collateral type

    const INPUT = selector + what + collateralType + encodeParameter("uint256", 1245).slice(2);

    const mockWeb3 = createMock(
      false,
      {
        collateralRatio: "2516557646144049203"
      },
      "2200000000000000000",
      "2500000000000000000",
      "Maker",
      1,
    );
    

    handleTransaction = provideHandleTransaction(mockWeb3);

    const txnEvent = new TestTransactionEvent().addTraces({
      to: JUG_CONTRACT,
      input: INPUT
    });

    let findings: Finding[];
    findings = await handleTransaction(txnEvent);

    expect(findings).toStrictEqual([]);
  });
});
