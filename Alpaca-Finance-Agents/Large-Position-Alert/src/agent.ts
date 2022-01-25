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

export const VAULT_ADDRESSES: string[] = [
  "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f", // BUSD
  "0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE", // ETH
  "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7", // BTCB
  "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7", // USDT
  "0xf1bE8ecC990cBcb90e166b71E368299f0116d421", // ALPACA
  "0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd"  // TUSD
];

const VAULT_MAP: Map<string, bigint> = new Map([
  [VAULT_ADDRESSES[0], BigInt(100000000000000000000000)], // 100,000 BUSD
  [VAULT_ADDRESSES[1], BigInt(30000000000000000000)],     // 30 ETH
  [VAULT_ADDRESSES[2], BigInt(3000000000000000000)],      // 3 BTCB
  [VAULT_ADDRESSES[3], BigInt(100000000000000000000000)], // 100,000 USDT
  [VAULT_ADDRESSES[4], BigInt(200000000000000000000000)], // 200,000 ALPACA
  [VAULT_ADDRESSES[5], BigInt(100000000000000000000000)]  // 100,000 TUSD
])

export const workEventAbi: string = 'event Work(uint256 indexed id, uint256 loan)';
const VAULT_IFACE: utils.Interface = new utils.Interface([workEventAbi]);
export const workEventSig: string = VAULT_IFACE.getEvent('Work').format('sighash');

function filterForVault(vaultAddresses: string[], address: string | null): [string, bigint | undefined] {
  let filteredAddress: string = " ";
  let filteredThreshold: bigint | undefined = BigInt(0);

  // TODO: CONFIRM USING toLowerCase() IS NOT CAUSING SECONDARY NEGATIVE EFFECTS
  if(address === vaultAddresses[0].toLowerCase()) {
    filteredAddress = vaultAddresses[0];
    filteredThreshold = VAULT_MAP.get(vaultAddresses[0])
  } else if(address === vaultAddresses[1].toLowerCase()) {
    filteredAddress = vaultAddresses[1];
    filteredThreshold = VAULT_MAP.get(vaultAddresses[1])
  } else if(address === vaultAddresses[2].toLowerCase()) {
    filteredAddress = vaultAddresses[2];
    filteredThreshold = VAULT_MAP.get(vaultAddresses[2])
  } else if(address === vaultAddresses[3].toLowerCase()) {
    filteredAddress = vaultAddresses[3];
    filteredThreshold = VAULT_MAP.get(vaultAddresses[3])
  } else if(address === vaultAddresses[4].toLowerCase()) {
    filteredAddress = vaultAddresses[4];
    filteredThreshold = VAULT_MAP.get(vaultAddresses[4])
  } else if(address === vaultAddresses[5].toLowerCase()) {
    filteredAddress = vaultAddresses[5];
    filteredThreshold = VAULT_MAP.get(vaultAddresses[5])
  }

  return [filteredAddress, filteredThreshold];
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
  addresses: string[],
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let [filteredAddress, filteredThreshold] = filterForVault(addresses, txEvent.to);

    const handler = provideEventCheckerHandler(
      createFindingGenerator(alertId),
      workEventSig,
      filteredAddress,
      function filterLoanAmount(): boolean {

        const filteredEvent = txEvent.filterEvent(workEventSig, filteredAddress);
        const decodedData = decodeParameters(
          ["uint256", "uint256"],
          filteredEvent[0].data // TODO: CONFIRM THERE WILL ONLY BE ONE EVENT PER TXN, SINCE HARD CODING FIRST ITEM
        );

        if(filteredThreshold && decodedData[1] > filteredThreshold) {
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

export default {
  handleTransaction: provideHandleTransaction(
    "ALPACA-1",
    VAULT_ADDRESSES
  )
};