import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent,
  getJsonRpcUrl
} from 'forta-agent'

import {
  provideEventCheckerHandler,
} from 'forta-agent-tools'

import {
  COMPOUND_COMPTROLLER_ADDRESS,
  NEW_IMPLEMENTATION_SIGNATURE,
  createFindingDetectNewComptrollerImplementation,
  createFindingNewCTokenImplementation, 
  getAllMarkets
} from './utils'

import Web3 from 'web3'

const web3: Web3 = new Web3(getJsonRpcUrl())

const provideHandleTransaction = (web3: Web3): HandleTransaction => {
  return async (txEvent: TransactionEvent) : Promise<Finding[]> => {
    const marketAddresses: string[] = await getAllMarkets(
      web3,
      txEvent.blockNumber
    )

    var findings : Finding[] = []

    findings = findings.concat(await provideEventCheckerHandler(
      createFindingDetectNewComptrollerImplementation, 
      NEW_IMPLEMENTATION_SIGNATURE,
      COMPOUND_COMPTROLLER_ADDRESS      
    )(txEvent))

    for (let address of marketAddresses)
    {
      findings = findings.concat(await provideEventCheckerHandler(
        createFindingNewCTokenImplementation, 
        NEW_IMPLEMENTATION_SIGNATURE,
        address )(txEvent))
    }

    return findings
  }
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(web3),
}
