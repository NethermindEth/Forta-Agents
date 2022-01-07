import { Finding, FindingType, FindingSeverity } from 'forta-agent';
import { decodeParameter, FindingGenerator } from 'forta-agent-tools';

export const ADDED_OWNER_SIG = 'AddedOwner(address)';
export const REMOVED_OWNER_SIG = 'RemovedOwner(address)';
export const CHANGED_THRESHOLD_SIG = 'ChangedThreshold(uint256)';

export const addresses = [
  '0x0cf30dc0d48604a301df8010cdc028c055336b2e', // POLICY CONTRACT
  '0x245cc372C84B3645Bf0Ffe6538620B04a217988B', // DAO CONTRACT
];

export const createAddedOwnerFindingGenerator = (
  contract: string
): FindingGenerator => {
  return (metadata) => {
    const addedOwner: string = decodeParameter('address', metadata?.data);
    return Finding.fromObject({
      name: 'Added Owner Event Detection',
      description: 'A new owner is added.',
      alertId: 'Olympus-1-1',
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: 'OlympusDAO',
      metadata: {
        owner: addedOwner,
        contract: contract,
      },
    });
  };
};

export const createRemovedOwnerFindingGenerator = (
  contract: string
): FindingGenerator => {
  return (metadata) => {
    const removedOwner: string = decodeParameter('address', metadata?.data);
    return Finding.fromObject({
      name: 'Removed Owner Event Detection',
      description: 'An owner is removed.',
      alertId: 'Olympus-1-2',
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: 'OlympusDAO',
      metadata: {
        owner: removedOwner,
        contract: contract,
      },
    });
  };
};

export const createChangedTHFindingGenerator = (
  contract: string
): FindingGenerator => {
  return (metadata) => {
    const TH = decodeParameter('uint256', metadata?.data);

    return Finding.fromObject({
      name: 'Change Threshold Event Detection',
      description: 'The threshold is changed.',
      alertId: 'Olympus-1-3',
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: 'OlympusDAO',
      metadata: {
        threshold: TH,
        contract: contract,
      },
    });
  };
};
