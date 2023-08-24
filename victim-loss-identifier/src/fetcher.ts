import { providers } from "ethers";
import { apiKeys, Erc721Transfer } from "./types";

export default class DataFetcher {
  provider: providers.Provider;
  private apiKeys: apiKeys;

  constructor(provider: providers.Provider, apiKeys: apiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
  }

  getTransactionReceipt = async (txHash: string) => {
    let receipt;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        receipt = await this.provider.getTransactionReceipt(txHash);
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
    return receipt;
  };

  getErc721TransfersInvolvingScammer = async (
    scammerAddress: string,
    transferOccuranceTimeWindow: number
  ): Promise<Erc721Transfer[]> => {
    let erc721Transfers: Erc721Transfer[] = [];

    const currentTime = new Date();
    const timeWindowInMs = transferOccuranceTimeWindow * 24 * 60 * 60 * 1000;

    const maxTimestamp = currentTime.toISOString();
    const minTimestamp = new Date(
      currentTime.getTime() - timeWindowInMs
    ).toISOString();

    const query = `
      query GetErc721Transfers($scammerAddress: String!, $minTimestamp: String!, $maxTimestamp: String!) {
        records(
          filter: {
            block_time: {
              min: $minTimestamp,
              max: $maxTimestamp
            },
          },
          to_address: $scammerAddress
        ) {
          transaction_hash
          contract_address
          from_address
          to_address
          token_id
          symbol
          name
          block_time
        }
      }
    `;

    const variables = {
      scammerAddress,
      minTimestamp,
      maxTimestamp,
    };

    const body = JSON.stringify({
      query,
      variables,
    });

    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        const response = await fetch(
          "https://api.zettablock.com/api/v1/dataset/sq_8b63dd1011c54ac8a1af53542a96f583/graphql",
          {
            method: "POST",
            body,
            headers: {
              accept: "application/json",
              "X-API-KEY": `${this.apiKeys["generalApiKeys"]["ZETTABLOCK"][0]}`,
              "content-type": "application/json",
            },
          }
        );
        const data = await response.json();
        erc721Transfers = data.data.records;
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          console.log(err); // log the error if maximum tries reached
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }

    return erc721Transfers;
  };
}
