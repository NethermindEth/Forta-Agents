import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import hre = require("hardhat");
import { getYearnVaults, getAccounts } from "./utils";
import Web3 from "web3";
import abi from "./abi";
const web3 = new Web3(getJsonRpcUrl());

let findingsCount = 0;
const exponent = 1e18;

type accountVaultPosition = {
  account: {
    id: string;
  };
  balancePosition: string;
  balanceShares: string;
  id: string;
  vault: {
    id: string;
  };
};

const withdrawPermittedValues = {};

const impersonateAccount = async (address: string) => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x364d6D0333432C3Ac016Ca832fb8594A8cE43Ca6"],
  });
};

const providerHandleBlock = (web3: Web3): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const accountVaultPositions: accountVaultPosition[] = await getAccounts();

    console.log(accountVaultPositions);

    // mock vaults and axios
    // now just init a withdraw event from the corresponding address from the axios respose
    // if its greater than X%.

    accountVaultPositions.forEach(async (value) => {
      const userAddress = value.account.id;
      const balance = new BigNumber(value.balanceShares);
      const vaultAddress = value.vault.id;

      await impersonateAccount(userAddress);
      const contract = new web3.eth.Contract(abi as any, vaultAddress);

      await contract.methods.withdraw(balance.multipliedBy(0.3)); // assuming 30# withdrawl feasible

      // check balanceOf to infer the result
    });

    return findings;
  };
};

export default {
  handleBlock: providerHandleBlock(web3),
  providerHandleBlock,
};
