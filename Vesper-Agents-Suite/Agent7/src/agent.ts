import { 
  Finding, 
  HandleTransaction, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'

import {
  FindingGenerator,
  provideEventCheckerHandler,
  decodeParameters
} from 'forta-agent-tools'

import {
  COMPOUND_COMPTROLLER_ADDRESS,
  NEW_IMPLEMENTATION_SIGNATURE,
  NEW_IMPLEMENTATION_EVENT_ALERT_ID
} from './utils'

const createFinding : FindingGenerator = (metadata: {[key:string] : any} | undefined) => {
  const { 1: newImplementationAddress} = decodeParameters(
    ['address', 'address'],
    metadata?.data
  );
  
  return Finding.fromObject({
    name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
    description: 'Update implementation logic for Compound Comptroller',
    alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID,
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: 'Compound',
    metadata: {
      newAddress: newImplementationAddress
    }
  })
}


const handleTransaction: HandleTransaction = provideEventCheckerHandler(
  createFinding,
  NEW_IMPLEMENTATION_SIGNATURE,
  COMPOUND_COMPTROLLER_ADDRESS
)

export default {
  handleTransaction,
}
