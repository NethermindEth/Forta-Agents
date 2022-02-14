import { 
  Finding, 
  getEthersProvider,
  HandleTransaction,
  LogDescription,
  TransactionEvent,
} from 'forta-agent';
import { BigNumber } from "ethers";
import VaultsFetcher from './vaults.fetcher';
import abi from './abi';
import { createFinding } from './findings';

const ZERO: BigNumber = BigNumber.from(0);
const PERCENT: BigNumber = BigNumber.from(40) // % this define what large means
const REGISTRY: string = "0xF7C2DCFF5E947a617288792e289984a2721C4671";

export const provideHandleTransaction = (
  fetcher: VaultsFetcher,
  percent: BigNumber,
): HandleTransaction => 
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;
    const vaults: Set<string> = await fetcher.getVaults(block);

    const logs: LogDescription[] = txEvent
      .filterLog(abi.VAULT)
      .filter((log: LogDescription) => 
        vaults.has(log.address.toLowerCase()) &&
        (ZERO.eq(log.args[0]) || ZERO.eq(log.args[1]))
      );
      
    const vaultsInUse: Set<string> = new Set<string>(
      logs.map((log: LogDescription) => log.address.toLowerCase())
    );

    const largeAmount: Record<string, BigNumber> = {};
    const supplyPromises: Promise<BigNumber>[] = [];
    vaultsInUse.forEach(
      (vault: string) => supplyPromises.push(fetcher
        .getSupply(block, vault)
        .then(
          (supply: BigNumber) => 
            largeAmount[vault] = supply.mul(percent).div(100),
        )
      )
    )
    await Promise.all(supplyPromises);
    
    const largeOperations: LogDescription[] = logs.filter(
      (log: LogDescription) => largeAmount[log.address.toLowerCase()].lte(log.args[2])
    );

    return largeOperations.map(createFinding);
  };

export default {
  handleTransaction: provideHandleTransaction(
    new VaultsFetcher(
      REGISTRY,
      getEthersProvider(),
    ),
    PERCENT,
  ),
};
