import { BlockEvent, Finding, HandleBlock, getJsonRpcUrl } from "forta-agent";
import hre from "hardhat";

import axios from "axios";
import { generateFinding, getAccounts, Mapping } from "./utils";
import Web3 from "web3";
import child_process from "child_process";
import ganacheCli from "ganache-cli";
import { withdrawAbi } from "./abi";
const web3 = new Web3(getJsonRpcUrl());

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

const impersonateAccount = async (address: string) => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
};

const providerHandleBlock = (web3: Web3, axios: any): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const accountVaultPositions: Mapping = await getAccounts();

    const vaults = Object.keys(accountVaultPositions);

    vaults.forEach(async (vaultAddress: string) => {
      const vault = accountVaultPositions[vaultAddress];

      vault.forEach(async (obj) => {
        const userAddress = obj.account;
        const balance = obj.balance;
        await impersonateAccount(obj.account);

        await impersonateAccount(userAddress);
        const contract = new web3.eth.Contract(
          withdrawAbi as any,
          vaultAddress
        );

        try {
          await contract.methods
            .withdraw(balance, userAddress, 0)
            .send({ from: userAddress });
        } catch (e) {
          // if the contract call fails, returns an error.
          findings.push(generateFinding(balance.toString()));
        }
      });
    });

    return findings;
  };
};

export default {
  handleBlock: providerHandleBlock(web3, axios),
  providerHandleBlock,
};
