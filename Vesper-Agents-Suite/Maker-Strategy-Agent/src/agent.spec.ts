import { Finding, HandleBlock } from 'forta-agent';
import { runBlock, TestBlockEvent } from 'forta-agent-tools';
import { BlockEvent } from 'forta-agent-tools/node_modules/forta-agent';
import { provideMakerStrategyHandler } from './agent';
import { createAddress } from 'forta-agent-tools';
import Mock from './mock/mock';

const poolAccountants = [createAddress('0x0'), createAddress('0x1')];

const mockWeb3 = {
  eth: { Contract: Mock.build_Mock(poolAccountants) },
} as any;

describe('Vesper Maker Strategy Agent Test Suite', () => {
  let handleBlock: HandleBlock;

  beforeAll(() => {
    handleBlock = provideMakerStrategyHandler(mockWeb3, 'Vesper-1');
  });

  it('should return empty findings', async () => {
    let findings: Finding[] = [];

    const blockEvent: BlockEvent = new TestBlockEvent();
    findings = [...(await handleBlock(blockEvent)), ...findings];
    console.log(findings);
  });
});
