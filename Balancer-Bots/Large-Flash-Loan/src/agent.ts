import BigNumber from "bignumber.js";
import { ethers, Finding, getEthersProvider, HandleTransaction, Initialize, TransactionEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { TOKEN_ABI, FLASH_LOAN_ABI } from "./constants";
import { createFinding } from "./finding";
import { NetworkData, SmartCaller, toBn } from "./utils";

BigNumber.set({ DECIMAL_PLACES: 18 });

const networkManager = new NetworkManager(CONFIG);

const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): HandleTransaction => {
  const tokenIface = new ethers.utils.Interface(TOKEN_ABI);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const logs = txEvent.filterLog(FLASH_LOAN_ABI, networkManager.get("vaultAddress"));

    await Promise.all(
      logs.map(async (log) => {
        const token = SmartCaller.from(new ethers.Contract(log.args.token, tokenIface, provider));

        const vaultBalance = toBn(
          await token.balanceOf(networkManager.get("vaultAddress"), { blockTag: txEvent.blockNumber - 1 })
        );

        const tvlPercentage = toBn(log.args.amount).dividedBy(vaultBalance).shiftedBy(2);

        if (tvlPercentage.gte(networkManager.get("tvlPercentageThreshold"))) {
          const symbol: string = await token.symbol({ blockTag: txEvent.blockNumber });
          const decimals: number = await token.decimals({ blockTag: txEvent.blockNumber });
          findings.push(createFinding(log, tvlPercentage, symbol, decimals));
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersProvider()),
};
