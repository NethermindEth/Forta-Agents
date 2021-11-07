import { Finding, FindingSeverity, FindingType } from 'forta-agent';
import { FindingGenerator } from 'forta-agent-tools';
import Web3 from 'web3';
import { StrategyABI } from './abi';

export const JUG_DRIP_FUNCTION_SIGNATURE = 'drip(bytes32)';
export const JUG_CONTRACT = '0x19c0976f590D67707E62397C87829d896Dc0f1F1';

export const POKE_SIGNATURE = 'Poke(bytes32,bytes32,uint256)';
export const SPOT_ADDRESS = '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3';

export const createFindingStabilityFee = (
  _strategy: string
): FindingGenerator => {
  return (metadata): Finding => {
    return Finding.fromObject({
      name: 'Stability Fee Update Detection',
      description: "stability Fee is changed for MAKER strategy's collateral",
      severity: FindingSeverity.High,
      type: FindingType.Info,
      alertId: 'Maker-3-1',
      protocol: 'Maker',
      metadata: {
        strategy: _strategy,
        collateralType: metadata?.arguments[0],
      },
    });
  };
};

export const createStaleSpotFinding = (
  spot: string,
  strategy: string
): Finding => {
  return Finding.fromObject({
    name: 'poke() NOT called detection',
    description:
      "poke() function is not called for several hours with MAKER strategy's ilk",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    alertId: 'Yearn-3-2',
    protocol: 'Yearn',
    metadata: {
      spot: spot,
      strategy: strategy,
    },
  });
};

export const getCollateralType = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = 'latest'
): Promise<string> => {
  const Strategy = new web3.eth.Contract(StrategyABI, address);
  const collateralType = await Strategy.methods.ilk().call({}, blockNumber);

  return collateralType;
};
