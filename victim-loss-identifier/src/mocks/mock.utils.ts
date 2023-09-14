import { createAddress } from "forta-agent-tools";
import { utils, BigNumber } from "ethers";
import { MockErc721Transfer, MockTxnReceipt, MockTxnResponse, MockExploitInfo } from "./mock.types";
import { TestAlertEvent } from "./mock.alert";

export function createMockScammerAddressBatch(amountInBatch: number): string[] {
  const mockScammerAddressBatch: string[] = [];

  for (let i = 1; i <= amountInBatch; i++) {
    mockScammerAddressBatch.push(createAddress(`0xdEaDBeEF${i}`));
  }

  return mockScammerAddressBatch;
}

export function createMockTxnReceipt(exploitInfoEntry: MockExploitInfo): MockTxnReceipt {
  return {
    logs: [
      {
        address: exploitInfoEntry.stolenTokenAddress,
        topics: [
          utils.id("Transfer(address,address,uint256)"),
          utils.hexZeroPad(utils.hexValue(exploitInfoEntry.victimAddress), 32),
          "mock to",
          utils.hexZeroPad(utils.hexValue(Number(exploitInfoEntry.stolenTokenId)), 32),
        ],
      },
    ],
  };
}

export function createMockTxnReceiptWithErc20TransferLog(
  exploitInfoEntry: MockExploitInfo,
  scammerAddress: string,
  erc20Address: string,
  erc20Amount: number
): MockTxnReceipt {
  return {
    logs: [
      {
        address: exploitInfoEntry.stolenTokenAddress,
        topics: [
          utils.id("Transfer(address,address,uint256)"),
          utils.hexZeroPad(utils.hexValue(exploitInfoEntry.victimAddress), 32),
          "mock to",
          utils.hexZeroPad(utils.hexValue(Number(exploitInfoEntry.stolenTokenId)), 32),
        ],
      },
      {
        address: erc20Address,
        topics: [
          utils.id("Transfer(address,address,uint256)"),
          utils.hexZeroPad(utils.hexValue(scammerAddress), 32),
          utils.hexZeroPad(utils.hexValue(exploitInfoEntry.victimAddress), 32),
          utils.hexZeroPad(utils.hexValue(erc20Amount), 32),
        ],
      },
    ],
  };
}

export function createMockTxnReceiptWithNftExchangeLogs(
  exploitInfoEntry: MockExploitInfo,
  scammerAddress: string,
  additionalErc721TokenId: number
): MockTxnReceipt {
  return {
    logs: [
      {
        address: exploitInfoEntry.stolenTokenAddress,
        topics: [
          utils.id("Transfer(address,address,uint256)"),
          utils.hexZeroPad(utils.hexValue(exploitInfoEntry.victimAddress), 32),
          utils.hexZeroPad(utils.hexValue(scammerAddress), 32),
          utils.hexZeroPad(utils.hexValue(Number(exploitInfoEntry.stolenTokenId)), 32),
        ],
      },
      {
        address: exploitInfoEntry.stolenTokenAddress,
        topics: [
          utils.id("Transfer(address,address,uint256)"),
          utils.hexZeroPad(utils.hexValue(scammerAddress), 32),
          utils.hexZeroPad(utils.hexValue(exploitInfoEntry.victimAddress), 32),
          utils.hexZeroPad(utils.hexValue(additionalErc721TokenId), 32),
        ],
      },
    ],
  };
}

export function createMockTxnReceiptBatch(mockExploitBatch: MockExploitInfo[]): MockTxnReceipt[] {
  const mockTxnReceiptBatch: MockTxnReceipt[] = [];

  for (let i = 0; i < mockExploitBatch.length; i++) {
    mockTxnReceiptBatch.push(createMockTxnReceipt(mockExploitBatch[i]));
  }

  return mockTxnReceiptBatch;
}

export function createMockTxnResponse(
  nftMarketPlaceAddress: string,
  exploitInfoEntry: MockExploitInfo
): MockTxnResponse {
  return {
    to: nftMarketPlaceAddress,
    value: exploitInfoEntry.txnValue,
    blockNumber: exploitInfoEntry.blockNumber,
  };
}

export function createMockTxnResponseBatch(
  nftMarketPlaceAddress: string,
  mockExploitBatch: MockExploitInfo[]
): MockTxnResponse[] {
  const mockTxnResponseBatch: MockTxnResponse[] = [];

  for (let i = 0; i < mockExploitBatch.length; i++) {
    mockTxnResponseBatch.push(createMockTxnResponse(nftMarketPlaceAddress, mockExploitBatch[i]));
  }

  return mockTxnResponseBatch;
}

export function createMockErc721Transfer(exploitInfoEntry: MockExploitInfo): MockErc721Transfer {
  return {
    transaction_hash: exploitInfoEntry.exploitTxnHash,
    from_address: exploitInfoEntry.fromAddress,
    contract_address: exploitInfoEntry.stolenTokenAddress,
    name: exploitInfoEntry.stolenTokenName,
    symbol: exploitInfoEntry.stolenTokenSymbol,
    token_id: exploitInfoEntry.stolenTokenId,
    block_time: "block time",
    to_address: "to address",
  };
}

function createMockExploitInstance(instanceNumber: number): MockExploitInfo {
  return {
    exploitTxnHash: utils.hexZeroPad(`0x${instanceNumber}0`, 32),
    fromAddress: createAddress(`0x${instanceNumber}10`),
    victimAddress: createAddress(`0x${instanceNumber}11`),
    stolenTokenAddress: createAddress(`0x${instanceNumber}1`),
    stolenTokenName: `MockErc721Token${instanceNumber}`,
    stolenTokenSymbol: `MOCK721-${instanceNumber}`,
    stolenTokenId: `${instanceNumber}3`,
    txnValue: BigNumber.from(instanceNumber),
    blockNumber: 18000000 + instanceNumber,
  };
}

export function createMockExploitBatch(amountInBatch: number): MockExploitInfo[] {
  const mockExploitBatch: MockExploitInfo[] = [];

  for (let i = 1; i <= amountInBatch; i++) {
    mockExploitBatch.push(createMockExploitInstance(i));
  }

  return mockExploitBatch;
}

export function createMockAlertEvent(
  alertId: string,
  alertBlockNumber: number,
  scammerAddress: string
): TestAlertEvent {
  return new TestAlertEvent(
    [],
    alertId,
    "",
    [],
    "",
    "",
    "",
    "",
    "",
    0,
    "",
    "",
    [],
    1,
    [],
    {
      block: {
        timestamp: "string",
        chainId: 1,
        hash: "",
        number: alertBlockNumber,
      },
    },
    {
      scammerAddresses: scammerAddress,
    }
  );
}
