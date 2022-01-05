import {
  Finding,
  FindingSeverity,
  FindingType,
  LogDescription,
} from 'forta-agent';

type FindingGenerator = (log: LogDescription, bond: string) => Finding;

export const BONDs = [
  '0x767e3459A35419122e5F6274fB1223d75881E0a9', // CVX Bond
  '0x575409F8d77c12B05feD8B455815f0e54797381c', // DAI Bond
  '0xE6295201CD1ff13CeD5f063a5421c39A1D236F1c', // ETH Bond
  '0x8510c8c2B6891E04864fa196693D44E6B6ec2514', // FRAX Bond
  '0x10C0f93f64e3C8D0a1b0f4B87d6155fd9e89D08D', // LUSD Bond
  '0x956c43998316b6a2F21f89a1539f73fB5B78c151', // OHM / DAI LP Bond
  '0xc20CffF07076858a7e642E396180EC390E5A02f7', // OHM / FRAX LP Bond
  '0xFB1776299E7804DD8016303Df9c07a65c80F67b6', // OHM / LUSD LP Bond
];

export const ABIs = [
  'event OwnershipPushed(address indexed previousOwner, address indexed newOwner)',
  'event OwnershipPulled(address indexed previousOwner, address indexed newOwner)',
];

const pushFinding: FindingGenerator = (
  log: LogDescription,
  bond: string
): Finding =>
  Finding.fromObject({
    name: 'OlympusDAO Bond Ownership event detected',
    description: 'OwnershipPushed event',
    alertId: 'olympus-10-1',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: 'OlympusDAO',
    metadata: {
      bond: bond,
      previousOwner: log.args['previousOwner'].toLowerCase(),
      newOwner: log.args['newOwner'].toLowerCase(),
    },
  });

const pullFinding: FindingGenerator = (
  log: LogDescription,
  bond: string
): Finding =>
  Finding.fromObject({
    name: 'OlympusDAO Bond Ownership event detected',
    description: 'OwnershipPulled event',
    alertId: 'olympus-10-2',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: 'OlympusDAO',
    metadata: {
      bond: bond,
      previousOwner: log.args['previousOwner'].toLowerCase(),
      newOwner: log.args['newOwner'].toLowerCase(),
    },
  });

const findingMap: Record<string, FindingGenerator> = {
  OwnershipPushed: pushFinding,
  OwnershipPulled: pullFinding,
};

export const createFinding = (log: LogDescription, bond: string): Finding =>
  findingMap[log.name](log, bond);
