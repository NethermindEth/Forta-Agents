import { BlockEvent, Finding, HandleBlock, getJsonRpcUrl } from "forta-agent";
import axios from "axios";
import { generateFinding, getAccounts, Mapping } from "./utils";
import Web3 from "web3";
import runServer from "./blockchain";
import { withdrawAbi } from "./abi";
import BigNumber from "bignumber.js";

const providerHandleBlock = (Web3: any, axios: any): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const { mapping, users } = await getAccounts(axios);

    const vaults = Object.keys(mapping);

    const server = await runServer(Array.from(users) as string[]);

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

        promises.push(
          contract.methods
            .withdraw(balance, userAddress, 0)
            .send({ from: userAddress })
            .then(() => {
              contract.methods
                .balanceOf(userAddress)
                .call({}, blockEvent.blockNumber)
                .then((res: string) => {
                  if (new BigNumber(res).gt(0)) {
                    findings.push(
                      generateFinding(
                        new BigNumber(res),
                        new BigNumber(balance),
                        index,
                        vaultAddress
                      )
                    );
                  }
                });
            })
        );
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
