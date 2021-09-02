import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  createBlockEvent,
  BlockEvent,
  Block,
  EventType,
  Network,
} from "forta-agent";
import Web3 from "web3";
import { StrategyParams, encodeStrategyParams } from "./abi.utils";

type mockVault = (data: string) => string;
type mockStrategy = (data: string) => string;
type strategyParamsCollection = { [key: string]: StrategyParams };

const web3: Web3 = new Web3();

const stripSelector = (data: string): string => {
  return data.slice(8);
};

const getSelector = (data: string): string => {
  return data.slice(0, 8);
};

const createBlockEventWithTimestamp = (timestamp: number): BlockEvent => {
  const block: Block = {
    timestamp: timestamp,
  } as Block;

  return createBlockEvent({
    type: EventType.BLOCK,
    network: Network.MAINNET,
    blockHash: "",
    blockNumber: 12,
    block: block,
  });
};

const createMockVault = (data: strategyParamsCollection): mockVault => {
  return (txData: string) => {
    const address: string = web3.eth.abi.decodeParameter(
      "address",
      stripSelector(txData)
    ) as any;
    return encodeStrategyParams(data[address]);
  };
};

const createMockStrategy = (
  vaultAddress: string,
  maxReportDelay: bigint
): mockStrategy => {
  return (txData: string) => {
    const selector: string = getSelector(txData);
    switch (selector) {
      case web3.eth.abi.encodeFunctionSignature("vault()"):
        return web3.eth.abi.encodeParameter("address", vaultAddress);

      case web3.eth.abi.encodeFunctionSignature("maxReportDelay()"):
        return web3.eth.abi.encodeParameter(
          "uint256",
          maxReportDelay.toString()
        );

      default:
        return "";
    }
  };
};

const createMockWeb3 = (
  vaultMock: mockVault,
  vaultAddress: string,
  strategyMock: mockStrategy,
  strategyAddress: string
): Web3 => {
  let txData: string, to: string;
  const call = ({ txData, to }: { txData: string; to: string }): string => {
    switch (to) {
      case vaultAddress:
        return vaultMock(txData);

      case strategyAddress:
        return strategyMock(txData);

      default:
        return "";
    }
  };

  return {
    eth: {
      call: call,
    },
  } as any;
};

export const createMocks = (
  strategyParams: strategyParamsCollection,
  maxReportDelay: bigint,
  vaultAddress: string,
  strategyAddress: string
): Web3 => {
  const vaultMock: mockVault = createMockVault(strategyParams);
  const strategyMock: mockStrategy = createMockStrategy(
    vaultAddress,
    maxReportDelay
  );
  return createMockWeb3(vaultMock, vaultAddress, strategyMock, strategyAddress);
};
