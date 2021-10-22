import { Finding } from 'forta-agent';
import {
  Agent,
  runBlock,
  TestBlockEvent,
  TestTransactionEvent,
} from 'forta-agent-tools';
import {
  BlockEvent,
  TransactionEvent,
} from 'forta-agent-tools/node_modules/forta-agent';
import { keccak256 } from 'web3-utils';
import { provideMakerStrategyHandler } from './agent';
import Mock from './mock/mock';

const mockWeb3 = {
  eth: { Contract: Mock.build_Mock() },
} as any;

describe('Vesper Maker Strategy Agent Test Suite', () => {});
