import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import { ERC20_TRANSFER_EVENT, WRAPPED_NATIVE_TOKEN_EVENTS, ZERO, wrappedNativeTokens } from "./utils";
import Fetcher from "./fetcher";
import { keys } from "./keys";

const provideHandleTransaction =
  (fetcher: Fetcher): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const balanceChangesMap: Map<string, Record<string, ethers.BigNumber>> = new Map();

    const erc20TransferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT).filter((event) => !event.args.value.eq(ZERO));
    let events = erc20TransferEvents;
    if (txEvent.network in wrappedNativeTokens) {
      const wrappedTokenEvents = txEvent
        .filterLog(WRAPPED_NATIVE_TOKEN_EVENTS, wrappedNativeTokens[txEvent.network])
        .filter((event) => !event.args.value.eq(ZERO));
      events = events.concat(wrappedTokenEvents);
    }

    await Promise.all(
      events.map(async (event) => {
        const token = event.address;
        let { from, to, value } = event.args;
        if (!from) {
          from = wrappedNativeTokens[txEvent.network];
        }

        // Update the balances map for 'from'
        if (balanceChangesMap.has(from)) {
          let currentEntry = balanceChangesMap.get(from);
          currentEntry![token] = (currentEntry![token] || ZERO).sub(value);
          balanceChangesMap.set(from, currentEntry!);
        } else {
          balanceChangesMap.set(from, { [token]: value.mul(-1) });
        }

        if (!to) {
          to = wrappedNativeTokens[txEvent.network];
        }

        if (balanceChangesMap.has(to)) {
          let currentEntry = balanceChangesMap.get(to);
          currentEntry![token] = (currentEntry![token] || ZERO).add(value);
          balanceChangesMap.set(to, currentEntry!);
        } else {
          balanceChangesMap.set(to, { [token]: value });
        }
      })
    );

    await Promise.all(
      txEvent.traces.map(async (trace) => {
        let { from, to, value, callType } = trace.action;

        if (value && value !== "0x0" && callType === "call") {
          from = ethers.utils.getAddress(from);
          to = ethers.utils.getAddress(to);
          const bnValue = ethers.BigNumber.from(value);

          // Update the native token balance for the from address
          if (balanceChangesMap.has(from)) {
            let currentEntry = balanceChangesMap.get(from);
            currentEntry!["native"] = (currentEntry!["native"] || ZERO).sub(bnValue);
            balanceChangesMap.set(from, currentEntry!);
          } else {
            balanceChangesMap.set(from, { ["native"]: bnValue.mul(-1) });
          }
          // Update the native token balance for the to address
          if (balanceChangesMap.has(to)) {
            let currentEntry = balanceChangesMap.get(to);
            currentEntry!["native"] = (currentEntry!["native"] || ZERO).add(bnValue);
            balanceChangesMap.set(to, currentEntry!);
          } else {
            balanceChangesMap.set(to, { ["native"]: bnValue });
          }
        }
      })
    );

    // Remove empty records
    balanceChangesMap.forEach((record: Record<string, ethers.BigNumber>, key: string) => {
      Object.keys(record).forEach((token) => {
        if (record[token].eq(ZERO)) {
          delete record[token];
        }
      });
      if (Object.keys(record).length === 0) {
        balanceChangesMap.delete(key);
      }
    });
    const balanceChangesMapUsd: Map<string, Record<string, number>> = new Map();
    // Get the USD value of the balance changes
    await Promise.all(
      Array.from(balanceChangesMap.entries()).map(async ([key, record]) => {
        const usdRecord: Record<string, number> = {};
        await Promise.all(
          Object.keys(record).map(async (token) => {
            const UsdValue = await fetcher.getValueInUsd(
              txEvent.blockNumber,
              txEvent.network,
              record[token].toString(),
              token
            );
            usdRecord[token] = UsdValue;
          })
        );
        balanceChangesMapUsd.set(key, usdRecord);
      })
    );

    const victims: { address: string; confidence: number }[] = [];
    console.log(balanceChangesMap, balanceChangesMapUsd);
    balanceChangesMapUsd.forEach((record: Record<string, number>, address: string) => {
      const sum = Object.values(record).reduce((acc, value) => {
        return acc + value;
      }, 0);
      // If the sum of the values is less than -100 USD, add the address to the victims list
      if (sum > 10000) {
        const confidence = fetcher.getExploitationStageConfidenceLevel(sum * -1, "usdValue") as number;
        victims.push({ address, confidence });
      }
    });
    console.log("HEREEE");
    // For tokens with no USD value fetched, check if the balance change is greater than 5% of the total supply
    await Promise.all(
      Array.from(balanceChangesMapUsd.entries()).map(async ([address, record]) => {
        return Promise.all(
          Object.keys(record).map(async (token) => {
            const usdValue = record[token];
            console.log("OPP");
            if (usdValue === 0) {
              const value = balanceChangesMap.get(address);

              if (!value![token].isNegative()) {
                const totalSupply = await fetcher.getTotalSupply(txEvent.blockNumber, token);
                const threshold = totalSupply.div(20); // 5%
                const absValue = value![token];
                console.log("APP");
                if (absValue.gt(threshold)) {
                  let percentage: number;
                  try {
                    percentage = absValue.mul(100).div(totalSupply).toNumber();
                  } catch {
                    percentage = 100;
                  }

                  const confidence = fetcher.getExploitationStageConfidenceLevel(percentage, "totalSupply") as number;
                  victims.push({ address, confidence });
                }
              }
            }
          })
        );
      })
    );
    console.log(victims);
    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(new Fetcher(getEthersProvider(), keys)),
  provideHandleTransaction,
};
