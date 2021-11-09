import { BigNumber } from 'bignumber.js';
import { Finding, FindingSeverity, FindingType } from 'forta-agent';
import util from 'util';
import {
  decodeParameter,
  decodeParameters,
  FindingGenerator,
} from 'forta-agent-tools';
import Web3 from 'web3';
import { OSM_ABI, StrategyABI } from './abi';

export const JUG_DRIP_FUNCTION_SIGNATURE = 'drip(bytes32)';
export const JUG_CONTRACT = '0x19c0976f590D67707E62397C87829d896Dc0f1F1';

export const POKE_SIGNATURE = 'Poke(bytes32,bytes32,uint256)';
export const SPOT_ADDRESS = '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3';

export const OSM_CONTRACTS = [
  '0xb4eb54af9cc7882df0121d26c5b97e802915abe6',
  '0x81fe72b5a8d1a857d176c3e7d5bd2679a9b85763',
  '0xf185d0682d50819263941e5f4eacc763cc5c6c42',
  '0xf36b79bd4c0904a5f350f1e4f776b81208c13069',
  '0x7382c066801e7acb2299ac8562847b9883f5cd3c',
  '0x8067259ea630601f319fcce477977e55c6078c13',
  '0x7a5918670b0c390ad25f7bee908c1acc2d314a3c',
  '0xbed0879953e633135a48a157718aa791ac0108e4',
  '0x9b0c694c6939b5ea9584e9b61c7815e8d97d9cc7',
  '0x9eb923339c24c40bef2f4af4961742aa7c23ef3a',
  '0x5f122465bcf86f45922036970be6dd7f58820214',
  '0x3ff860c0f28d69f392543a16a397d0dae85d16de',
  '0xf363c7e351c96b910b92b45d34190650df4ae8e7',
  '0x8df8f06dc2de0434db40dcbb32a82a104218754c',
  '0x8874964279302e6d4e523fb1789981c39a1034ba',
  '0xfc8137e1a45baf0030563ec4f0f851bd36a85b7d',
  '0x8400d2edb8b97f780356ef602b1bdbc082c2ad07',
  '0xf751f24dd9cfad885984d1ba68860f558d21e52a',
  '0x25d03c2c928ade19ff9f4ffecc07d991d0df054b',
  '0x5f6dd5b421b8d92c59dc6d907c9271b1dbfe3016',
  '0xd7d31e62ae5bfc3bfaa24eda33e8c32d31a1746f',
  '0x8462a88f50122782cc96108f476dedb12248f931',
  '0x5bb72127a196392cf4ac00cf57ab278394d24e55',
  '0x32d8416e8538ac36272c44b0cd962cd7e0198489',
  '0x9a1cd705dc7ac64b50777bceca3529e58b1292f1',
  '0x65c79fcb50ca1594b025960e539ed7a9a6d434a3',
];

export const createFindingStabilityFee = (
  _strategy: string
): FindingGenerator => {
  return (metadata): Finding => {
    return Finding.fromObject({
      name: 'Stability Fee Update Detection',
      description: "stability Fee is changed for MAKER strategy's collateral",
      severity: FindingSeverity.High,
      type: FindingType.Info,
      alertId: 'Yearn-3-1',
      protocol: 'Yearn',
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
    name: 'Stale Spot Price In Vat detection',
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

export const checkOSMContracts = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = 'latest'
) => {
  const slot3 = await web3.eth.getStorageAt(address, 3, 'latest');
  console.log(slot3);

  const value = slot3.slice(-15);
  const has = slot3.slice(33, -15);
  console.log(has);
  console.log(value);
  console.log(
    '****************************************************************'
  );

  return {
    address,
  };
};

const getAllSimpleStorage = async (web3: Web3, addr: string) => {
  let slot = 0;
  let zeroCounter = 0;
  const simpleStorage = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await web3.eth.getStorageAt(addr, slot);
    if (new BigNumber(data).eq(0)) {
      zeroCounter++;
    }

    simpleStorage.push({ slot, data });
    slot++;

    if (zeroCounter > 10) {
      break;
    }
  }

  return simpleStorage;
};
