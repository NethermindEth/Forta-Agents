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

const createFinding = (
  vault: string, 
  cur: BigNumber, 
  prev: BigNumber,
): Finding => Finding.fromObject({
  name: "Vault PPS anomaly detected",
  description: "Vault PPS decreasement",
  alertId: "pickle-5",
  protocol: "Pickle Finance",
  severity: FindingSeverity.High,
  type: FindingType.Suspicious,
  metadata: {
    vault,
    curRatio: cur.toString(),
    prevRatio: prev.toString(),
  },
});

export const provideHandleBlock = (fetcher: VaultsFetcher): HandleBlock => 
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
  ),
};
