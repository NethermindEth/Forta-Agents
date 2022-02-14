import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  FindingSeverity, 
  FindingType, 
  getEthersProvider
} from 'forta-agent';
import { BigNumber } from "ethers";
import VaultsFetcher from './vaults.fetcher';

const REGISTRY: string = "0xF7C2DCFF5E947a617288792e289984a2721C4671";
const INC_PERCENT: BigNumber = BigNumber.from(10);

const finding = (
  vault: string, 
  cur: BigNumber, 
  prev: BigNumber,
  change: string,
  id: string,
): Finding => Finding.fromObject({
  name: "Vault PPS anomaly detected",
  description: `Vault PPS ${change}`,
  alertId:  `pickle-5-${id}`,
  protocol: "Pickle Finance",
  severity: FindingSeverity.High,
  type: FindingType.Suspicious,
  metadata: {
    vault,
    curRatio: cur.toString(),
    prevRatio: prev.toString(),
  },
});

const createFinding = (
  vault: string, 
  cur: BigNumber, 
  prev: BigNumber,
  inc: boolean,
): Finding => inc? 
  finding(vault, cur, prev, "increasement", "1"): 
  finding(vault, cur, prev, "decreasement", "2"); 

export const provideHandleBlock = (
  fetcher: VaultsFetcher,
  percent: BigNumber,  
): HandleBlock => 
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const block: number = blockEvent.blockNumber;
    const vaults: string[] = await fetcher.getVaults(block);

    const ratioPromises: Promise<BigNumber>[] = [];
    vaults.forEach(vault => ratioPromises.push(fetcher.getPPS(block, vault)));
    vaults.forEach(vault => ratioPromises.push(fetcher.getPPS(block - 1, vault)));

    const ratio: BigNumber[] = await Promise.all(ratioPromises);
    for(let i = 0; i < vaults.length; ++i) {
      if(ratio[i].lt(ratio[i + vaults.length]))
        findings.push(createFinding(
          vaults[i],
          ratio[i],
          ratio[i + vaults.length],
          false,
        ))
      const increasement: BigNumber = ratio[i + vaults.length].mul(percent).div(100);
      if(ratio[i].gt(ratio[i + vaults.length].add(increasement)))
        findings.push(createFinding(
          vaults[i],
          ratio[i],
          ratio[i + vaults.length],
          true,
        ))
    }

    return findings;
  };

export default {
  handleBlock: provideHandleBlock(
    new VaultsFetcher(
      REGISTRY,
      getEthersProvider(),
    ),
    INC_PERCENT,
  ),
};
