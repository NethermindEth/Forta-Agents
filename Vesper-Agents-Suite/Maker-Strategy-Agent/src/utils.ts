import { Finding, FindingSeverity, FindingType } from "forta-agent";
import Web3 from "web3";
import { Strategy_ABI, CM_ABI } from "./abi";
import { FindingGenerator } from "forta-agent-tools";

export const JUG_CHANGE_BASE_FUNCTION_SIGNATURE = "file(bytes32,uint256)";
export const JUG_CHANGE_DUTY_FUNCTION_SIGNAUTRE = "file(bytes32,bytes32,uint256)";
export const JUG_CONTRACT = "0x19c0976f590D67707E62397C87829d896Dc0f1F1";

export const createFindingStabilityFee = (
  _strategy: string
): FindingGenerator => {
  return (metadata): Finding => {
    return Finding.fromObject({
      name: "Stability Fee Update Detection",
      description: "stability Fee is changed for related strategy's collateral",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      alertId: "Vesper-1-3",
      protocol: "Vesper",
      metadata: {
        strategy: _strategy,
        collateralType: metadata?.arguments[1],
        newDuty: metadata?.arguments[2],
      }
    });
  };
};

export const createFindingBaseStabilityFee = (): FindingGenerator => {
  return (metadata): Finding => {
    return Finding.fromObject({
      name: "Stability Fee Update Detection",
      description: "Base stability Fee changed",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      alertId: "Vesper-1-4",
      protocol: "Vesper",
      metadata: {
        newBase: metadata?.arguments[1]
      }
    });
  };
};

export const createFindingIsUnderWater = (_strategy: string): Finding => {
  return Finding.fromObject({
    name: "Maker Type Strategy isUnderWater Detection",
    description: "IsUnderWater returned True for a Maker Strategy",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    alertId: "Vesper-1-2",
    protocol: "Vesper",
    metadata: {
      strategy: _strategy
    }
  });
};

export const createFindingLowWater = (
  _strategy: string,
  _collateralRatio: string,
  _lowWater: string
): Finding => {
  return Finding.fromObject({
    name: "Maker Type Strategy Collateral Ratio < lowWater Detection",
    description: "Collateral Ratio is below lowWater",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    alertId: "Vesper-1-1",
    protocol: "Vesper",
    metadata: {
      strategy: _strategy,
      collateralRatio: _collateralRatio,
      lowWater: _lowWater
    }
  });
};

export const createFindingHighWater = (
  _strategy: string,
  _collateralRatio: string,
  _highWater: string
): Finding => {
  return Finding.fromObject({
    name: "Maker Type Strategy Collateral Ratio > highWater Detection",
    description: "Collateral Ratio is above highWater",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "Vesper-1-1",
    protocol: "Vesper",
    metadata: {
      strategy: _strategy,
      collateralRatio: _collateralRatio,
      highWater: _highWater
    }
  });
};

export const checkIsUnderWaterTrue = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<boolean> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const isUnderwater = await Strategy.methods
    .isUnderwater()
    .call({}, blockNumber);

  return isUnderwater;
};

export const getCollateralRatio = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
) => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const CM_ADDRESS = await Strategy.methods.cm().call({}, blockNumber);

  const CM = new web3.eth.Contract(CM_ABI, CM_ADDRESS);
  const collateralRatio = await CM.methods
    .getVaultInfo(address)
    .call({}, blockNumber);

  return collateralRatio;
};

export const getLowWater = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);

  const lowWater = await Strategy.methods.lowWater().call({}, blockNumber);

  return lowWater;
};

export const getHighWater = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<number> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const highWater = await Strategy.methods.highWater().call({}, blockNumber);

  return highWater;
};

export const getCollateralType = async (
  web3: Web3,
  address: string,
  blockNumber: string | number = "latest"
): Promise<string> => {
  const Strategy = new web3.eth.Contract(Strategy_ABI, address);
  const collateralType = await Strategy.methods
    .collateralType()
    .call({}, blockNumber);

  return collateralType;
};
