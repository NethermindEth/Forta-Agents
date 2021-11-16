import BigNumber from "bignumber.js";
//@ts-ignore
import ganache from "ganache";
import path from "path";
require("dotenv").config();

const FORK_TESTS_CACHE_PATH = path.join(
  __dirname,
  "..",
  "provider",
  ".hardhat_node_test_cache"
);

export const DEFAULT_HARDFORK = "byzantium";

export default function runServer(accounts: Array<string>) {
  const options = {
    chainId: 1,
    networkId: 1,
    port: 9545,
    fork: process.env.jsonRPC,
    hardfork: DEFAULT_HARDFORK,
    fork_block_number: 12628504,
    forkCachePath: FORK_TESTS_CACHE_PATH,
    blockGasLimit: 210000,
    locked: false,
    genesisAccounts: [],
    unlockedAccounts: accounts,
    keepAliveTimout: 5000, // default value
  };
  const server = ganache.server(options);

  server.listen(9545);
}
