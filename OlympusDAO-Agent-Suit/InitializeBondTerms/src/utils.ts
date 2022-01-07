import {
  Finding,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import { utils } from "ethers";
import { Interface } from '@ethersproject/abi';

const BONDS_CONTRACTS = [
  '0x767e3459A35419122e5F6274fB1223d75881E0a9', // CVX Bond
  '0x575409F8d77c12B05feD8B455815f0e54797381c', // DAI Bond
  '0xE6295201CD1ff13CeD5f063a5421c39A1D236F1c', // ETH Bond
  '0x8510c8c2B6891E04864fa196693D44E6B6ec2514', // FRAX Bond
  '0x10C0f93f64e3C8D0a1b0f4B87d6155fd9e89D08D', // LUSD Bond
  '0x956c43998316b6a2F21f89a1539f73fB5B78c151', // OHM / DAI LP Bond
  '0xc20CffF07076858a7e642E396180EC390E5A02f7', // OHM / FRAX LP Bond
  '0xFB1776299E7804DD8016303Df9c07a65c80F67b6', // OHM / LUSD LP Bond
];

const BONDS_ABI = [
  `function initializeBondTerms( 
    uint _controlVariable, 
    uint _vestingTerm,
    uint _minimumPrice,
    uint _maxPayout,
    uint _maxDebt,
    uint _initialDebt
  )`,
  `function initializeBondTerms( 
    uint _controlVariable, 
    uint _vestingTerm,
    uint _minimumPrice,
    uint _maxPayout,
    uint _fee,
    uint _maxDebt,
    uint _initialDebt
  )`,
];

const REDEEM_HELPER_IFACE = new Interface([
  "function bonds(uint256 index) external view returns (address)",
]);

const initBondTermsFinding = (
  metadata: Record<string, string>, 
): Finding =>
  Finding.fromObject({
    name: 'OlympusDAO Bond function call detected',
    description: 'Call to initializeBondTerms',
    alertId: 'olympus-bond-4',
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: 'OlympusDAO',
    metadata,
  });

const createFinding = (
  desc: utils.TransactionDescription,
  bond: string, 
): Finding => {
  const metadata: Record<string, string> = {
    bond: bond.toLowerCase(),
    _controlVariable: desc.args['_controlVariable'].toString(),
    _vestingTerm: desc.args['_vestingTerm'].toString(),
    _minimumPrice: desc.args['_minimumPrice'].toString(),
    _maxPayout: desc.args['_maxPayout'].toString(),
    _maxDebt: desc.args['_maxDebt'].toString(),
    _initialDebt: desc.args['_initialDebt'].toString(),
  }
  if(desc.sighash == "0x71535008")
    Object.assign(metadata, {_fee: desc.args['_fee'].toString(),})
  return initBondTermsFinding(metadata);
}

export default {
  BONDS_ABI,
  BONDS_CONTRACTS,
  REDEEM_HELPER_IFACE,
  createFinding,
};
