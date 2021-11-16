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
import axios from "axios";
import { getAccounts } from "./utils";
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

const providerHandleBlock = (web3: Web3, axios: any): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const accountVaultPositions: accountVaultPosition[] = await getAccounts(
      axios
    );

    console.log(accountVaultPositions);

    accountVaultPositions.forEach(async (value) => {
      const userAddress = value.account.id;
      const balance = new BigNumber(value.balanceShares);
      const vaultAddress = value.vault.id;

      await impersonateAccount(userAddress);
      const contract = new web3.eth.Contract(abi as any, vaultAddress);

      contract.methods
        .withdraw(balance.multipliedBy(0.3))
        .on("transactionHash", (hash: string) => {
          console.log("TX Hash", hash);
        })
        .then((receipt: any) => {
          console.log("Mined", receipt);
          if (receipt.status == "0x1" || receipt.status == 1) {
            console.log("Transaction Success");
          } else
            findings.push(
              Finding.fromObject({
                name: "Yearn-agent-7",
                description: "30% of amount couldnt be withdrawn",
                severity: FindingSeverity.Info,
                type: FindingType.Unknown,
                alertId: "Yearn-agent-7",
              })
            );
        })
        .catch((err: any) => {
          console.log("Error", err);
        });
    });

    return findings;
  };
};

export default {
  handleBlock: providerHandleBlock(web3, axios),
  providerHandleBlock,
};
