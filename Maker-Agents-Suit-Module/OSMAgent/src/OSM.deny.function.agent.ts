import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';

import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from '@nethermindeth/general-agents-module';
import { OSM_CONTRACTS } from './utils';

export const DENY_FUNCTION_SIG = 'deny(address)';
