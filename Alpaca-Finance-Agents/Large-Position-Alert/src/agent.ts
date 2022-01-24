import BigNumber from 'bignumber.js'
import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'
import {
  provideEventCheckerHandler,
  FindingGenerator,
  decodeParameters
} from "forta-agent-tools";
import { utils } from 'ethers';

export const VAULTS = {
  BUSD: {
    address: "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f",
    threshold: BigInt(100000000000000000000000) // 100,000 BUSD
  },
  ETH: {
    address: "0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE",
    threshold: BigInt(30000000000000000000) // 30 ETH
  },
  BTCB: {
    address: "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7",
    threshold: BigInt(3000000000000000000) // 3 BTCB
  },
  USDT: {
    address: "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7",
    threshold: BigInt(100000000000000000000000) // 100,000 USDT
  },
  ALPACA: {
    address: "0xf1bE8ecC990cBcb90e166b71E368299f0116d421",
    threshold: BigInt(200000000000000000000000) // 200,000 ALPACA
  },
  TUSD: {
    address: "0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd",
    threshold: BigInt(100000000000000000000000) // 100,000 TUSD
  }
}

export const workEventAbi: string = 'event Work(uint256 indexed id, uint256 loan)';
const VAULT_IFACE: utils.Interface = new utils.Interface([workEventAbi]);
export const workEventSig: string = VAULT_IFACE.getEvent('Work').format('sighash');

function filterForVault(address: string | null): { address: string; threshold: bigint; } | undefined {
  let vault;
  if(address === VAULTS["BUSD"].address) {
    vault = VAULTS["BUSD"];
  } else if(address === VAULTS["ETH"].address) {
    vault = VAULTS["ETH"];
  } else if(address === VAULTS["BTCB"].address) {
    vault = VAULTS["BTCB"];
  } else if(address === VAULTS["USDT"].address) {
    vault = VAULTS["USDT"];
  } else if(address === VAULTS["ALPACA"].address) {
    vault = VAULTS["ALPACA"];
  } else if(address === VAULTS["TUSD"].address) {
    vault = VAULTS["TUSD"];
  }
  return vault;
}

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    const decodedData = decodeParameters(
      ["uint256", "uint256"],
      metadata?.data
    );

    return Finding.fromObject({
      name: "Large Position Event",
      description: "Large Position Has Been Taken",
      alertId: alertId,
      severity: FindingSeverity.Info, // TODO: FIND OUT WHICH Severity TO USE HERE (Info?)
      type: FindingType.Unknown,  // TODO: FIND OUT WHICH Type TO USE HERE (Unknown?)
      metadata:{
        positionId: decodedData[0],
        borrowAmount: decodedData[1]
      },
    });
  };
};

export function provideHandleTransaction(
  alertId: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let filteredVault = filterForVault(address);

    const handler = provideEventCheckerHandler(
      createFindingGenerator(alertId),
      workEventSig,
      filteredVault?.address,
      function filterLoanAmount(): boolean {

        const filteredEvent = txEvent.filterEvent(workEventSig, filteredVault?.address);
        const decodedData = decodeParameters(
          ["uint256", "uint256"],
          filteredEvent[0].data // TODO: CONFIRM THERE WILL ONLY BE ONE EVENT PER TXN, SINCE HARD CODING FIRST ITEM
        );

        if(filteredVault?.threshold && decodedData[1] > filteredVault?.threshold) {
          return true;
        } else {
          return false;
        }
      }
    );
    const findings: Finding[] = await handler(txEvent);

    return findings
  }
}

/*
export default {
  handleTransaction: provideHandleTransaction(
    "ALPACA-1"
  )
};
*/