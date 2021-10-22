import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleBlock,
} from 'forta-agent';
import { runBlock, TestBlockEvent } from 'forta-agent-tools';
import { BlockEvent } from 'forta-agent-tools/node_modules/forta-agent';
import { provideMakerStrategyHandler } from './agent';
import { createAddress } from 'forta-agent-tools';
import Mock from './mock/mock';
import { createFinding, TYPE } from './utils';

const poolAccountants = [createAddress('0x0'), createAddress('0x1')];
const ALERT_ID = 'Vesper-1';

describe('Vesper Maker Strategy Agent Test Suite', () => {
  let handleBlock: HandleBlock;

  it('should return empty findings if isUnderWater=False', async () => {
    const mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(
          poolAccountants,
          false,
          {
            collateralRatio: '2516557646144049203',
          },
          '2200000000000000000',
          '2600000000000000000'
        ),
      },
    } as any;

    handleBlock = provideMakerStrategyHandler(mockWeb3, ALERT_ID);

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = [...(await handleBlock(blockEvent))];
    expect(findings).toStrictEqual([]);
  });

  it('should return 2 findings because of collateral ratio > high water', async () => {
    const COLLATERAL_RATIO = '2516557646144049203';
    const LOW_WATER = '2200000000000000000';
    const HIGH_WATER = '2500000000000000000';

    const mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(
          poolAccountants,
          false,
          {
            collateralRatio: COLLATERAL_RATIO,
          },
          LOW_WATER,
          HIGH_WATER
        ),
      },
    } as any;

    handleBlock = provideMakerStrategyHandler(mockWeb3, 'Vesper-1');

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(
        ALERT_ID,
        TYPE.highWater,
        Mock.STRATEGIES_V2.toString(),
        COLLATERAL_RATIO,
        HIGH_WATER
      ),
      createFinding(
        ALERT_ID,
        TYPE.highWater,
        Mock.STRATEGIES_V3.toString(),
        COLLATERAL_RATIO,
        HIGH_WATER
      ),
    ]);
  });

  it('should return findings because of collateral ratio < low water', async () => {
    const COLLATERAL_RATIO = '2116557646144049203';
    const LOW_WATER = '2200000000000000000';
    const HIGH_WATER = '2500000000000000000';

    const mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(
          poolAccountants,
          false,
          {
            collateralRatio: COLLATERAL_RATIO,
          },
          LOW_WATER,
          HIGH_WATER
        ),
      },
    } as any;

    handleBlock = provideMakerStrategyHandler(mockWeb3, 'Vesper-1');

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(
        ALERT_ID,
        TYPE.lowWater,
        Mock.STRATEGIES_V2.toString(),
        COLLATERAL_RATIO,
        LOW_WATER
      ),
      createFinding(
        ALERT_ID,
        TYPE.lowWater,
        Mock.STRATEGIES_V3.toString(),
        COLLATERAL_RATIO,
        LOW_WATER
      ),
    ]);
  });

  it('should return findings because of isUnderWater=True', async () => {
    const COLLATERAL_RATIO = '2516557646144049203';
    const LOW_WATER = '2200000000000000000';
    const HIGH_WATER = '2500000000000000000';

    const mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(
          poolAccountants,
          true, // isUnderWater
          {
            collateralRatio: COLLATERAL_RATIO,
          },
          LOW_WATER,
          HIGH_WATER
        ),
      },
    } as any;

    handleBlock = provideMakerStrategyHandler(mockWeb3, 'Vesper-1');

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(ALERT_ID, TYPE.isUnderWater, Mock.STRATEGIES_V2.toString()),
      createFinding(ALERT_ID, TYPE.isUnderWater, Mock.STRATEGIES_V3.toString()),
    ]);
  });

  it('should return empty findings if no Maker name included', async () => {
    const COLLATERAL_RATIO = '2516557646144049203';
    const LOW_WATER = '2200000000000000000';
    const HIGH_WATER = '2500000000000000000';

    const mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(
          poolAccountants,
          true, // isUnderWater
          {
            collateralRatio: COLLATERAL_RATIO,
          },
          LOW_WATER,
          HIGH_WATER,
          'UniSwap'
        ),
      },
    } as any;

    handleBlock = provideMakerStrategyHandler(mockWeb3, 'Vesper-1');

    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });
});
