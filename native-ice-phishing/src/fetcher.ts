import fetch from "node-fetch";
import { providers } from "ethers";
import LRU from "lru-cache";

export default class DataFetcher {
  provider: providers.Provider;
  private eoaCache: LRU<string, boolean>;
  private functionCache: LRU<string, string>;
  private signatureDbUrl: string =
    "https://raw.githubusercontent.com/ethereum-lists/4bytes/master/signatures/";

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.eoaCache = new LRU<string, boolean>({ max: 10000 });
    this.functionCache = new LRU<string, string>({ max: 10000 });
  }

  isEoa = async (address: string) => {
    if (this.eoaCache.has(address))
      return this.eoaCache.get(address) as boolean;
    let code;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        code = await this.provider.getCode(address);
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          throw err; // re-throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }

    const isEoa = code === "0x";
    this.eoaCache.set(address, isEoa);
    return isEoa;
  };

  getSignature = async (bytes: string) => {
    if (this.functionCache.has(bytes))
      return this.functionCache.get(bytes) as string;

    const url = this.signatureDbUrl + bytes.slice(2, 10);

    let response;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        response = await (await fetch(url)).text();
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          throw err; // re-throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }

    if (response && !response.startsWith("404")) {
      this.functionCache.set(bytes, response);
      return response;
    } else {
      return undefined;
    }
  };
}
