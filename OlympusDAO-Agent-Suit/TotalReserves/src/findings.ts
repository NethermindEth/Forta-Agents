import { 
  Finding, 
  FindingSeverity, 
  FindingType,
} from 'forta-agent';
import { BigNumber } from 'ethers';

const reserveIncreasement = (
  initialReserve: BigNumber, 
  curReserve: BigNumber, 
  percentChange: number
): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury totalReserves monitor",
  description: "Big increasement detected",
  alertId: "olympus-treasury-3-1",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    totalReserve: initialReserve.toString(),
    changedTo: curReserve.toString(),
    increasedBy: `${percentChange}% or more`,
  },
});

const reserveDecreasement = (
  initialReserve: BigNumber, 
  curReserve: BigNumber, 
  percentChange: number
): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury totalReserves monitor",
  description: "Big decreasement detected",
  alertId: "olympus-treasury-3-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    totalReserve: initialReserve.toString(),
    changedTo: curReserve.toString(),
    decreasedBy: `${percentChange}% or more`,
  },
});

const checkValues = (
  initialReserve: BigNumber, 
  curReserve: BigNumber, 
  percentChange: number
): Finding[] => {
  const percent: BigNumber = initialReserve
    .mul(BigNumber.from(percentChange))
    .div(BigNumber.from(100));
  if(curReserve.gte(initialReserve.add(percent)))
    return [reserveIncreasement(initialReserve, curReserve, percentChange)];
  if(curReserve.lte(initialReserve.sub(percent)))
    return [reserveDecreasement(initialReserve, curReserve, percentChange)];
  return [];
};

export default {
  checkValues,
};
