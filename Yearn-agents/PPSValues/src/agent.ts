import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import Web3 from "web3";
import abi from "./vault.abi";

const web3 = new Web3(getJsonRpcUrl());

export const createFinding = (ppo: string, tracker: string, reason: string) => {
  return Finding.fromObject({
    name: "Yearn PPS Agent",
    description: `Year PPS value: ${reason}`,
    alertId: "Yearn-3",
    severity: FindingSeverity.High,
    type: FindingType.Unknown,
    metadata: {
      ppo,
      tracker,
    },
  });
};

const provideHandleFunction = (web3: Web3): HandleBlock => {
  const vault = new web3.eth.Contract(
    abi as any,
    "0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7"
  );
  let tracker = new BigNumber(0);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    // console.log(await vault.methods.getPricePerFullShare().call());
    const pps = new BigNumber(
      await vault.methods.getPricePerFullShare().call()
    );

    console.log(tracker.toNumber(), pps);

    // pps should increase only
    if (pps.isLessThan(tracker)) {
      findings.push(
        createFinding(pps.toString(), tracker.toString(), "Decrese in PPS")
      );
    }

    // swift change in pps
    if (Math.abs(pps.minus(tracker).dividedBy(tracker).toNumber()) > 0.1) {
      findings.push(
        createFinding(pps.toString(), tracker.toString(), "Very Swift change")
      );
    }

    tracker = pps;
    return findings;
  };
};

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
