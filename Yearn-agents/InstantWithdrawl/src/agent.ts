import { BlockEvent, Finding, HandleBlock, getJsonRpcUrl } from "forta-agent";
import axios, { AxiosPromise } from "axios";
import { generateFinding, getAccounts, Mapping } from "./utils";
import Web3 from "web3";
import runServer from "./blockchain";
import { withdrawAbi } from "./abi";

const providerHandleBlock = (Web3: any, axios: any): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const { mapping, users } = await getAccounts(axios);

    const vaults = Object.keys(mapping);

    const server = await runServer(Array.from(users) as string[]);
    server.listen(9545);
    const provider = server.provider;

    const web3 = new Web3(provider);

    const promises: Promise<any>[] = [];

    vaults.forEach(async (vaultAddress: string) => {
      const vault = mapping[vaultAddress];

      vault.forEach(async (obj, index) => {
        const userAddress = obj.account;
        const balance = obj.balance;

        const contract = new web3.eth.Contract(
          withdrawAbi as any,
          vaultAddress
        );

        return contract.methods
          .withdraw(balance, userAddress, 0)
          .send({ from: userAddress })
          .catch(() => {
            // if the contract call fails, returns an error.
            findings.push(
              generateFinding(balance.toString(), index, vaultAddress)
            );
          });
      });
    });

    await Promise.all(promises);
    await server.close();
    return findings;
  };
};

export default {
  handleBlock: providerHandleBlock(Web3, axios),
  providerHandleBlock,
};
