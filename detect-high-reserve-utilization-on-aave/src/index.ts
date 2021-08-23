import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import Web3 from "web3";
import ReserveUtilizationGetter from "./reserveUtilizationGetter";
import { Assets, ASSETS_ADDRESSES, UtilizationLevel, TREHSHOLDS_VALUES, AssetsNames } from "./constants";

const web3: Web3 = new Web3(getJsonRpcUrl());
const reserveUtilizationGetter: ReserveUtilizationGetter = new ReserveUtilizationGetter(web3);



const getUtilizationLevel = (utilization: bigint): number => {
  let utilizationLevel: number = UtilizationLevel.Normal;
  for (let ul in Object.values(UtilizationLevel)) {
    if (utilization >= TREHSHOLDS_VALUES[ul]) {
      utilizationLevel = ul as any;
    }
  }
  return utilizationLevel;
}

const getSeverity = (utilizationLevel: number): FindingSeverity => {
  return {
    [UtilizationLevel.High]: FindingSeverity.Medium,
    [UtilizationLevel.VeryHigh]: FindingSeverity.High,
    [UtilizationLevel.Critical]: FindingSeverity.Critical,
  }[utilizationLevel] as FindingSeverity;
}

const createFinding = (asset: number, utilizationLevel: number): Finding => {
  const severity: FindingSeverity = getSeverity(utilizationLevel);
  const metadata: { [key: string]: string } = {
    "Asset": AssetsNames[asset]
  }
  return Finding.fromObject({
    name: "High use Aave reserve",
    description: "Detects assets with high use of their reserve in Aave protocol",
    alertId: "NETHFORTA-14",
    severity: severity,
    type: FindingType.Suspicious,
    metadata: metadata
  });
}

export const provideHandleBlock = (
  reserveUtilizationGetter: ReserveUtilizationGetter
): HandleBlock => {

  const lastState: { [key: number ]: number } = {
    [Assets.USDC]: UtilizationLevel.Normal,
    [Assets.DAI]: UtilizationLevel.Normal,
    [Assets.USDT]: UtilizationLevel.Normal
  };
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    for (let asset in Object.values(Assets)) {
      const assetAddress = ASSETS_ADDRESSES[asset];
      const utilization = await reserveUtilizationGetter.getUtilization(assetAddress);
      const utilizationLevel = getUtilizationLevel(utilization);
      const needToNotify = utilizationLevel > lastState[asset];
      lastState[asset] = utilizationLevel;
      if (needToNotify) {
        findings.push(createFinding(asset as any, utilizationLevel));
      }
    }
    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(reserveUtilizationGetter)
};
