import fetch from "node-fetch";
import { providers } from "ethers";
import LRU from "lru-cache";
import { EVM } from "evm";
import { etherscanApis } from "./config";
import {
  OWNER_ABI,
  fromTxCountThreshold,
  toTxCountThreshold,
  Response,
  BUY_TOKENS_SIG,
} from "./utils";
import ErrorCache from "./error.cache";
import * as util from "util";
import { ethers } from "forta-agent";
import { createErrorAlert } from "./findings";
import { apiKeys } from "./storage";

export default class DataFetcher {
  provider: providers.Provider;
  private eoaCache: LRU<string, boolean>;
  private codeCache: LRU<string, string>;
  private functionCache: LRU<string, string>;
  private nonceCache: LRU<string, number>;
  private ownerCache: LRU<string, string>;
  private apiKeys: apiKeys;
  private signatureDbUrl: string =
    "https://raw.githubusercontent.com/ethereum-lists/4bytes/master/signatures/";

  constructor(provider: providers.Provider, apiKeys: apiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.eoaCache = new LRU<string, boolean>({ max: 50000 });
    this.codeCache = new LRU<string, string>({ max: 10000 });
    this.nonceCache = new LRU<string, number>({ max: 50000 });
    this.functionCache = new LRU<string, string>({ max: 10000 });
    this.ownerCache = new LRU<string, string>({ max: 10000 });
  }

  private getBlockExplorerKey = (chainId: number) => {
    const apiKeysMap: Record<number, string[]> = {
      1: this.apiKeys.apiKeys.nativeIcePhishing.etherscanApiKeys,
      10: this.apiKeys.apiKeys.nativeIcePhishing.optimisticEtherscanApiKeys,
      56: this.apiKeys.apiKeys.nativeIcePhishing.bscscanApiKeys,
      137: this.apiKeys.apiKeys.nativeIcePhishing.polygonscanApiKeys,
      250: this.apiKeys.apiKeys.nativeIcePhishing.fantomscanApiKeys,
      42161: this.apiKeys.apiKeys.nativeIcePhishing.arbiscanApiKeys,
      43114: this.apiKeys.apiKeys.nativeIcePhishing.snowtraceApiKeys,
    };

    const selectedApiKeys = apiKeysMap[chainId];
    return this.getRandomApiKey(selectedApiKeys);
  };

  private getRandomApiKey = (apiKeys: string[]) => {
    return apiKeys.length > 0
      ? apiKeys[Math.floor(Math.random() * apiKeys.length)]
      : "YourApiKeyToken";
  };

  // Fetches transactions in descending order (newest first)
  private getEtherscanAddressUrl = (
    address: string,
    chainId: number,
    offset: number
  ) => {
    const { urlAccount } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${urlAccount}&address=${address}&startblock=0&endblock=99999999&page=1&offset=${
      offset + 1
    }&sort=asc&apikey=${key}`;
  };

  private getEtherscanAddressInternalTxsUrl = (
    address: string,
    chainId: number,
    offset: number
  ) => {
    const { urlAccountInternalTxs } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${urlAccountInternalTxs}&address=${address}&startblock=0&endblock=99999999&page=1&offset=${
      offset + 1
    }&sort=asc&apikey=${key}`;
  };

  private getSourceCodeUrl = (address: string, chainId: number) => {
    const { sourceCode } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${sourceCode}&address=${address}&apikey=${key}`;
  };

  private getLogsUrl = (
    address: string,
    blockNumber: number,
    chainId: number
  ) => {
    const { logs } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${logs}&address=${address}&fromBlock=0&toBlock=${blockNumber}&page=1&offset=2&apikey=${key}`;
  };

  getCode = async (address: string) => {
    if (this.codeCache.has(address))
      return this.codeCache.get(address) as string;

    let code;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        code = await this.provider.getCode(address);
        break; // exit the loop if successful
      } catch (err: any) {
        tries++;
        // if (tries === maxTries) {
        //   const stackTrace = util.inspect(err, {
        //     showHidden: false,
        //     depth: null,
        //   });
        //   ErrorCache.add(
        //     createErrorAlert(err.toString(), "fetcher.getCode", stackTrace)
        //   );
        // }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
    if (code && code !== "0x") {
      this.codeCache.set(address, code);
    }
    return code;
  };

  getStorageSlot = async (
    address: string,
    slot: number,
    blockNumber: number
  ) => {
    let storageSlot;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        storageSlot = await this.provider.getStorageAt(
          address,
          slot,
          blockNumber
        );
        break; // exit the loop if successful
      } catch (err: any) {
        tries++;
        if (tries === maxTries) {
          const stackTrace = util.inspect(err, {
            showHidden: false,
            depth: null,
          });
          ErrorCache.add(
            createErrorAlert(
              err.toString(),
              "fetcher.getStorageSlot",
              stackTrace
            )
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
    return storageSlot;
  };

  isEoa = async (address: string) => {
    if (this.eoaCache.has(address))
      return this.eoaCache.get(address) as boolean;

    const code = await this.getCode(address);

    if (!code) {
      return undefined;
    }
    const isEoa = code === "0x";
    this.eoaCache.set(address, isEoa);
    return isEoa;
  };

  getLabel = async (address: string, chainId: number): Promise<string> => {
    if (![1, 137, 250].includes(chainId)) return "";

    const maxRetries = 3;

    const LABELS_SOURCE =
      chainId === 1 ? "etherscan" : chainId === 137 ? "polygon" : "fantom";

    const url = `https://api.forta.network/labels/state?entities=${address}&sourceIds=${LABELS_SOURCE}-tags&limit=1`;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await (await fetch(url)).json();
        return response.events.length > 0
          ? response.events[0]["label"]["label"]
          : "";
      } catch (error) {
        console.log(`Error fetching label: ${error}`);

        // wait for 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return "";
  };

  getLabelFromEtherscan = async (address: string): Promise<string[]> => {
    const url = `https://api-metadata.etherscan.io/v1/api.ashx?module=nametag&action=getaddresstag&address=${address}&apikey=${this.apiKeys.generalApiKeys.ETHERSCAN_METADATA_TOKEN}`;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await (await fetch(url)).json();
        if (!response || !response.result.length) return [];
        let { nametag, labels, labels_slug } = response.result[0];
        return [
          ...new Set(
            [nametag, ...labels, ...labels_slug].map((label) =>
              label.toLowerCase()
            )
          ),
        ];
      } catch (error) {
        console.log(`Error fetching label from Etherscan: ${error}`);

        // wait for 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return [];
  };

  getNonce = async (address: string) => {
    if (this.nonceCache.has(address)) {
      return this.nonceCache.get(address) as number;
    }

    let nonce = 100000;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        nonce = await this.provider.getTransactionCount(address);
        this.nonceCache.set(address, nonce);
        break; // exit the loop if successful
      } catch (err: any) {
        tries++;
        if (tries === maxTries) {
          const stackTrace = util.inspect(err, {
            showHidden: false,
            depth: null,
          });
          ErrorCache.add(
            createErrorAlert(err.toString(), "fetcher.getNonce", stackTrace)
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }

    return nonce;
  };

  getSignature = async (bytes: string) => {
    if (this.functionCache.has(bytes))
      return this.functionCache.get(bytes) as string;

    const url = this.signatureDbUrl + bytes.slice(2, 10);

    let response: any;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        response = await (await fetch(url)).text();
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          throw err; // throw the error if maximum tries reached
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

  getAddressInfo = async (
    txTo: string,
    txFrom: string,
    chainId: number,
    hash: string
  ) => {
    const maxRetries = 3;
    let result;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (
          await fetch(
            this.getEtherscanAddressUrl(txTo, chainId, toTxCountThreshold)
          )
        ).json();

        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("No transactions found")
        ) {
          console.log(
            `block explorer error occured (attempt ${attempt}); retrying check for ${txTo}`
          );
          if (attempt === maxRetries) {
            console.log(
              `block explorer error occured (final attempt); skipping check for ${txTo}`
            );
            return [null, null];
          }
        } else {
          break;
        }
      } catch {
        console.log(`An error occurred during the fetch (attempt ${attempt}):`);
        if (attempt === maxRetries) {
          console.log(
            `Error during fetch (final attempt); skipping check for ${txTo}`
          );
          return [null, null];
        }
      }
    }

    let numberOfInteractions: number = 0;
    result.result.forEach((tx: any) => {
      if (tx.to === txFrom || (tx.from === txFrom && tx.hash !== hash)) {
        numberOfInteractions++;
      }
    });

    const isFirstInteraction = numberOfInteractions === 0;
    const hasHighNumberOfTotalTxs = result.result.length > toTxCountThreshold;

    return [isFirstInteraction, hasHighNumberOfTotalTxs];
  };

  haveInteractedAgain = async (
    attacker: string,
    victims: string[],
    chainId: number
  ) => {
    let hasInteractedAgain: boolean = false;

    const maxRetries = 3;
    let result: { message: string; result: any[] } = {
      message: "",
      result: [],
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (
          await fetch(this.getEtherscanAddressUrl(attacker, chainId, 9999))
        ).json();

        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("No transactions found")
        ) {
          console.log(
            `block explorer error occured (attempt ${attempt}); retrying check for ${attacker}`
          );
          if (attempt === maxRetries) {
            console.log(
              `block explorer error occured (final attempt); skipping check for ${attacker}`
            );
            hasInteractedAgain = true;
            return hasInteractedAgain;
          }
        } else {
          break;
        }
      } catch {
        console.log(`An error occurred during the fetch (attempt ${attempt}):`);
        if (attempt === maxRetries) {
          console.log(
            `Error during fetch (final attempt); skipping check for ${attacker}`
          );
          hasInteractedAgain = true;
          return hasInteractedAgain;
        }
      }
    }

    for (const victim of victims) {
      let numberOfInteractions = 0;

      for (let i = 0; i < result.result.length; i++) {
        const tx = result.result[i];

        if (tx.to === attacker && tx.from === victim) {
          numberOfInteractions++;
        }

        if (numberOfInteractions > 1) {
          hasInteractedAgain = true;
          break;
        }
      }

      if (hasInteractedAgain) {
        break;
      }
    }

    return hasInteractedAgain;
  };

  haveInteractedWithSameAddress = async (
    attacker: string,
    victims: string[],
    chainId: number
  ) => {
    let haveInteractedWithSameAddress: boolean = false;
    let victimInteractions: Record<string, string[]> = {}; // key: victim, value: array of "to" addresses

    await Promise.all(
      victims.map(async (victim) => {
        const maxRetries = 3;
        let result: { message: string; result: any[] } = {
          message: "",
          result: [],
        };

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            result = await (
              await fetch(this.getEtherscanAddressUrl(victim, chainId, 100))
            ).json();

            if (
              result.message.startsWith("NOTOK") ||
              result.message.startsWith("Query Timeout") ||
              result.message.startsWith("No transactions found")
            ) {
              console.log(
                `block explorer error occured (attempt ${attempt}); retrying check for ${victim}`
              );
              if (attempt === maxRetries) {
                console.log(
                  `block explorer error occured (final attempt); skipping check for ${victim}`
                );
                haveInteractedWithSameAddress = true;
                return haveInteractedWithSameAddress;
              }
            } else {
              break;
            }
          } catch {
            console.log(
              `An error occurred during the fetch (attempt ${attempt}):`
            );
            if (attempt === maxRetries) {
              console.log(
                `Error during fetch (final attempt); skipping check for ${victim}`
              );
              haveInteractedWithSameAddress = true;
              return haveInteractedWithSameAddress;
            }
          }
        }

        let toAddresses: string[] = [];
        result.result.forEach((tx: any) => {
          if (![attacker, victim].includes(tx.to)) {
            toAddresses.push(tx.to);
          }
        });
        victimInteractions[victim] = Array.from(new Set(toAddresses));
      })
    );

    let frequencyMap: { [key: string]: string[] } = {}; // Map of address called -> array of "victims" who called it
    for (const victim in victimInteractions) {
      const toAddresses = victimInteractions[victim];

      toAddresses.forEach((toAddress) => {
        if (!frequencyMap[toAddress]) {
          frequencyMap[toAddress] = [];
        }
        if (!frequencyMap[toAddress].includes(victim)) {
          frequencyMap[toAddress].push(victim);
        }
      });
    }

    const majorityThreshold = Math.ceil(victims.length / 2);
    for (const address in frequencyMap) {
      if (frequencyMap[address].length >= majorityThreshold) {
        haveInteractedWithSameAddress = true;
        break;
      }
    }

    return haveInteractedWithSameAddress;
  };

  isRecentlyInvolvedInTransfer = async (
    address: string,
    hash: string,
    chainId: number,
    blockNumber: number,
    transactions = null
  ) => {
    let result =
      transactions || (await this.fetchTransactions(address, chainId));

    if (!result) {
      return true;
    }

    result.result.forEach((tx: any) => {
      if (
        tx.hash !== hash &&
        tx.value !== "0" &&
        parseInt(tx.blockNumber) >= blockNumber - 10 &&
        parseInt(tx.blockNumber) < blockNumber
      ) {
        return true;
      }
    });

    return false;
  };

  isMajorityNativeTransfers = async (
    address: string,
    chainId: number,
    transactions = null
  ) => {
    let result =
      transactions || (await this.fetchTransactions(address, chainId));

    if (!result) return true;

    const outboundTransactions = result.result.filter(
      (tx: any) => tx.from === address
    );
    const outboundEthTransfers = outboundTransactions.filter(
      (tx: any) => tx.value !== "0"
    ).length;

    return (
      outboundTransactions.length >= 5 &&
      outboundEthTransfers > 0.75 * outboundTransactions.length
    );
  };

  fetchTransactions = async (address: string, chainId: number) => {
    const maxRetries = 3;
    let result: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (
          await fetch(this.getEtherscanAddressUrl(address, chainId, 1000))
        ).json();
        if (
          ["NOTOK", "Query Timeout", "No transactions found"].some((msg) =>
            result.message.startsWith(msg)
          )
        ) {
          console.log(
            `block explorer error occurred (attempt ${attempt}); retrying for ${address}`
          );
          if (attempt === maxRetries) {
            console.log(`final attempt failed; skipping ${address}`);
            return null;
          }
        } else {
          return result; // Successfully fetched data
        }
      } catch (error) {
        console.log(
          `An error occurred during the fetch (attempt ${attempt}): ${error}`
        );
        if (attempt === maxRetries) {
          console.log(`Error during final attempt; skipping ${address}`);
          return null;
        }
      }
    }
  };

  hasValidEntries = async (
    owner: string,
    address: string,
    chainId: number,
    hash: string
  ) => {
    const maxRetries = 3;
    let result: Response = { message: "", status: "", result: [] };
    let hasValidEntries = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (
          await fetch(
            this.getEtherscanAddressUrl(address, chainId, toTxCountThreshold)
          )
        ).json();
        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("No transactions found")
        ) {
          console.log(
            `block explorer error occured (attempt ${attempt}); retrying check for ${address}`
          );
          if (attempt === maxRetries) {
            console.log(
              `block explorer error occured (final attempt); skipping check for ${address}`
            );
            return false;
          }
        } else {
          break;
        }
      } catch {
        console.log(`An error occurred during the fetch (attempt ${attempt}):`);
        if (attempt === maxRetries) {
          console.log(
            `Error during fetch (final attempt); skipping check for ${address}`
          );
          return false;
        }
      }
    }
    result.result.forEach((entry: any, i: number) => {
      if (entry.hash === hash && i >= 3) {
        const prevEntries = result.result.slice(i - 3, i) as any[];
        const hasZeroValue = prevEntries.some(
          (prevEntry) => prevEntry.value === "0"
        );
        const hasOwnerInteractedBefore = prevEntries.some(
          (prevEntry) => prevEntry.from === owner
        );
        const hasLongCalldata = prevEntries.some(
          (prevEntry) => prevEntry.input.length > 74
        );
        const hasRoundValues = prevEntries.some((prevEntry) =>
          prevEntry.value.endsWith("000000")
        );
        const hasDuplicateFrom = prevEntries.some(
          (prevEntry, j) =>
            prevEntries.findIndex(
              (otherPrevEntry) => otherPrevEntry.from === prevEntry.from
            ) !== j
        );
        const hasDuplicateValue = prevEntries.some(
          (prevEntry, j) =>
            prevEntries.findIndex(
              (otherPrevEntry) => otherPrevEntry.value === prevEntry.value
            ) !== j
        );
        // Manually filter out known false positives (buyTokens(uint256) function signature)
        const hasBuyTokensSig = prevEntries.some((prevEntry) =>
          prevEntry.input.startsWith(BUY_TOKENS_SIG)
        );

        if (
          !hasZeroValue &&
          !hasOwnerInteractedBefore &&
          !hasLongCalldata &&
          !hasRoundValues &&
          !hasDuplicateFrom &&
          !hasDuplicateValue &&
          !hasBuyTokensSig
        ) {
          hasValidEntries = true;
        }
      }
    });

    return hasValidEntries;
  };

  getAddresses = async (address: string, chainId: number, hash: string) => {
    // setting offset to 1 as we only need the first tx
    let url = this.getEtherscanAddressUrl(
      address,
      chainId,
      fromTxCountThreshold
    );
    const maxRetries = 3;
    let result;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (await fetch(url)).json();

        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("No transactions found")
        ) {
          console.log(
            `block explorer error occured (attempt ${attempt}); retrying check for ${address}`
          );
          if (attempt === maxRetries) {
            console.log(
              `block explorer error occured (final attempt); skipping check for ${address}`
            );
            return [null, null];
          }
        } else {
          break;
        }
      } catch {
        console.log(`An error occurred during the fetch (attempt ${attempt}):`);
        if (attempt === maxRetries) {
          console.log(
            `Error during fetch (final attempt); skipping check for ${address}`
          );
          return [null, null];
        }
      }
    }

    let latestTo = null;
    for (let i = result.result.length - 1; i >= 0; i--) {
      if (result.result[i].hash === hash) {
        // Found the target hash, look for the latest entry with matching 'from'
        for (let j = i - 1; j >= 0; j--) {
          if (result.result[j].from === address) {
            // Found the latest entry with matching 'from', store the 'to' value and exit the loop
            latestTo = result.result[j].to;
            break;
          }
        }
        break;
      }
    }
    latestTo ??= "";

    let fundingAddress;
    if (result.result[0].to === address) {
      fundingAddress = result.result[0].from;
      return [fundingAddress, latestTo];
    } else {
      url = this.getEtherscanAddressInternalTxsUrl(address, chainId, 1);
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          result = await (await fetch(url)).json();

          if (
            result.message.startsWith("NOTOK") ||
            result.message.startsWith("Query Timeout") ||
            result.message.startsWith("No transactions found")
          ) {
            console.log(
              `block explorer error occured (attempt ${attempt}); retrying check for ${address}`
            );
            if (attempt === maxRetries) {
              console.log(
                `block explorer error occured (final attempt); skipping check for ${address}`
              );
              return [null, null];
            }
          } else {
            break;
          }
        } catch {
          console.log(
            `An error occurred during the fetch (attempt ${attempt}):`
          );
          if (attempt === maxRetries) {
            console.log(
              `Error during fetch (final attempt); skipping check for ${address}`
            );
            return [null, null];
          }
        }
      }

      fundingAddress = result.result[0].from;
      return [fundingAddress, latestTo];
    }
  };

  getFunctions = async (code: string) => {
    const evm = new EVM(code);
    const functions = evm.getFunctions();
    return functions;
  };

  getEvents = async (code: string) => {
    const evm = new EVM(code);
    const events = evm.getEvents();
    return events;
  };

  getSourceCode = async (address: string, chainId: number) => {
    const maxRetries = 3;
    let result;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (
          await fetch(this.getSourceCodeUrl(address, chainId))
        ).json();

        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("No transactions found")
        ) {
          console.log(
            `block explorer error occured (attempt ${attempt}); retrying check for ${address}`
          );
          if (attempt === maxRetries) {
            console.log(
              `block explorer error occured (final attempt); skipping check for ${address}`
            );
            return "";
          }
        } else {
          break;
        }
      } catch {
        console.log(`An error occurred during the fetch (attempt ${attempt}):`);
        if (attempt === maxRetries) {
          console.log(
            `Error during fetch (final attempt); skipping check for ${address}`
          );
          return "";
        }
      }
    }

    return result.result[0].SourceCode;
  };

  getNumberOfLogs = async (
    address: string,
    blockNumber: number,
    chainId: number
  ) => {
    const maxRetries = 3;
    let result;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (
          await fetch(this.getLogsUrl(address, blockNumber, chainId))
        ).json();

        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("No transactions found")
        ) {
          console.log(
            `block explorer error occured (attempt ${attempt}); retrying check for ${address}`
          );
          if (attempt === maxRetries) {
            console.log(
              `block explorer error occured (final attempt); skipping check for ${address}`
            );
            return 10;
          }
        } else {
          break;
        }
      } catch {
        console.log(`An error occurred during the fetch (attempt ${attempt}):`);
        if (attempt === maxRetries) {
          console.log(
            `Error during fetch (final attempt); skipping check for ${address}`
          );
          return 10;
        }
      }
    }

    return result.result.length;
  };

  getOwner = async (address: string, block: number): Promise<string> => {
    const key: string = `${address} - ${block}`;
    if (this.ownerCache.has(key)) return this.ownerCache.get(key) as string;

    const contract = new ethers.Contract(address, OWNER_ABI, this.provider);
    let owner: string;
    try {
      owner = await contract.owner({
        blockTag: block,
      });
    } catch {
      try {
        owner = await contract.getOwner({ blockTag: block });
      } catch {
        owner = "";
      }
    }
    this.ownerCache.set(key, owner);
    return owner;
  };

  isValueUnique = async (
    address: string,
    chainId: number,
    hash: string,
    value: string
  ) => {
    const maxRetries = 3;
    let result;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await (
          await fetch(this.getEtherscanAddressUrl(address, chainId, 100))
        ).json();
        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("No transactions found")
        ) {
          console.log(
            `block explorer error occured (attempt ${attempt}); retrying check for ${address}`
          );
          if (attempt === maxRetries) {
            console.log(
              `block explorer error occured (final attempt); skipping check for ${address}`
            );
            return false;
          }
        } else {
          break;
        }
      } catch {
        console.log(`An error occurred during the fetch (attempt ${attempt}):`);
        if (attempt === maxRetries) {
          console.log(
            `Error during fetch (final attempt); skipping check for ${address}`
          );
          return false;
        }
      }
    }
    for (const tx of result.result) {
      if (tx.hash !== hash && tx.value === value) {
        return false; // value is not unique for the given hash
      }
    }

    return true; // value is unique for the given hash
  };
}
