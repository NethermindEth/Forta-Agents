import { HandleTransaction, TransactionEvent, getEthersProvider, ethers } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import newGeneratorBot from "./new.random.generator";
import newOperatorBot from "./new.operator.and.treasury.and.injector.address";
import functionCallBot from "./function.call.listener";
import { PANCAKE_SWAP_LOTTERY_ADDRESS, TEST_PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";
import { MOCK_CONTRACT_ADDRESS } from "./bot.test.constants";

let CONTRACT_ADDRESS = MOCK_CONTRACT_ADDRESS;

const initialize = async () => {
  interface NetworkData {
    network: string;
    num: number;
  }

  const data: Record<number, NetworkData> = {
    56: {
      network: "BSC",
      num: 1,
    },
    97: {
      network: "BSCTestnet",
      num: 2,
    },
  };

  const provider = getEthersProvider();
  const networkManager = new NetworkManager(data);

  await networkManager.init(provider);

  let num = networkManager.get("num");

  if (num === 1) {
    CONTRACT_ADDRESS = PANCAKE_SWAP_LOTTERY_ADDRESS;
  } else if (num === 2) {
    CONTRACT_ADDRESS = TEST_PANCAKE_SWAP_LOTTERY_ADDRESS;
  }
};

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  let newGeneratorBotHandleTransaction = newGeneratorBot.providerHandleTransaction(CONTRACT_ADDRESS);
  let newOperatorBotHandleTransaction = newOperatorBot.providerHandleTransaction(CONTRACT_ADDRESS);
  let functionCallBotHandleTransaction = functionCallBot.providerHandleTransaction(CONTRACT_ADDRESS);

  const findings = (
    await Promise.all([
      newGeneratorBotHandleTransaction(txEvent),
      newOperatorBotHandleTransaction(txEvent),
      functionCallBotHandleTransaction(txEvent),
    ])
  ).flat();

  return findings;
};

export default {
  initialize,
  handleTransaction,
};
