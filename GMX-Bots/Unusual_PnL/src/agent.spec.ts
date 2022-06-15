import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideBotHandler } from "./agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";
import { encodeParameter } from "forta-agent-tools/lib/utils";

import NetworkManager from "./network";
import BigNumber from "bignumber.js";
BigNumber.set({ DECIMAL_PLACES: 18 });
const testCreateFinding = (positionSize: BigNumber, realisedPnl: BigNumber, key: string, contract: string): Finding =>
  Finding.fromObject({
    name: "Unusual PnL",
    description: "ClosePosition Event with a high pnl emitted from GMX's Vault contract",
    alertId: "GMX-6",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "GMX",
    metadata: {
      "Realised PnL": realisedPnl.toFixed(2),
      "Position size": positionSize.toFixed(2),
      GMX: contract,
      "Position key": key,
    },
  });

const TEST_GMX_VAULT = createAddress("0x256H");
const TEST_UNUSUAL_LIMIT = 500;
const SOME_OTHER_ADDRESS = createAddress("0x578");
const TEST_PRICE_PRECISION = 30;
const TEST_HIGH_PNLTOSIZE = 1; // percent

const createClosePositionEvent = (
  vaultAddress: string,
  key: string,
  size: ethers.BigNumber,
  pnl: ethers.BigNumber
): [string, string, string] => {
  const data = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "uint256", "uint256", "uint256", "uint256", "uint256", "int256"],
    [key, size, 0, 0, 0, 0, pnl]
  );
  return ["ClosePosition(bytes32,uint256,uint256,uint256,uint256,uint256,int256)", vaultAddress, data];
};

const createSomeOtherEvent = (contractAddress: string, arg1: string): [string, string, string] => {
  const data: string = encodeParameter("uint256", arg1);
  return ["SomeOtherEvent(uint256)", contractAddress, data];
};

describe("Unusual PnL from a closed position test suite", () => {
  const mockNetworkManager: NetworkManager = {
    vault: TEST_GMX_VAULT,
    highPnlToSize: TEST_HIGH_PNLTOSIZE,
    unUsualLimit: TEST_UNUSUAL_LIMIT,
    setNetwork: jest.fn(),
  };

  const handleTransaction: HandleTransaction = provideBotHandler(mockNetworkManager);

  it("should return empty findings when there are only other events from the vault", async () => {
    const eventLog = createSomeOtherEvent(TEST_GMX_VAULT, "56");
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings when the ClosePosition event is from other contracts", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const size = ethers.BigNumber.from(50000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const realisedPnl = ethers.BigNumber.from(510).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog = createClosePositionEvent(SOME_OTHER_ADDRESS, key, size, realisedPnl);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings when the realisedPnl isn't UNUSUAL", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const size = ethers.BigNumber.from(20000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    // realisedPnl < TEST_UNUSUAL_LIMIT
    const realisedPnl = ethers.BigNumber.from(490).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog = createClosePositionEvent(TEST_GMX_VAULT, key, size, realisedPnl);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings when the PNLTOSIZE isn't HIGH", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const size = ethers.BigNumber.from(70000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    // PNLTOSIZE < TEST_HIGH_PNLTOSIZE
    const realisedPnl = ethers.BigNumber.from(600).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog = createClosePositionEvent(TEST_GMX_VAULT, key, size, realisedPnl);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should correctly return a finding when the realisedPnl is UNUSUAL and PNLTOSIZE is HIGH", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const size = ethers.BigNumber.from(55000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const realisedPnl = ethers.BigNumber.from(600).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog = createClosePositionEvent(TEST_GMX_VAULT, key, size, realisedPnl);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      testCreateFinding(
        new BigNumber(size.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        new BigNumber(realisedPnl.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        key,
        TEST_GMX_VAULT
      ),
    ]);
  });

  it("should correctly return multiple findings when there are multiple ClosePosition events", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const size = ethers.BigNumber.from(55000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const realisedPnl = ethers.BigNumber.from(600).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog = createClosePositionEvent(TEST_GMX_VAULT, key, size, realisedPnl);

    const key2 = ethers.utils.formatBytes32String("positionKey2");
    const size2 = ethers.BigNumber.from(20000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const realisedPnl2 = ethers.BigNumber.from(-510).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog2 = createClosePositionEvent(TEST_GMX_VAULT, key2, size2, realisedPnl2);

    const key3 = ethers.utils.formatBytes32String("positionKey3");
    const size3 = ethers.BigNumber.from(80000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const realisedPnl3 = ethers.BigNumber.from(-900).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog3 = createClosePositionEvent(TEST_GMX_VAULT, key3, size3, realisedPnl3);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(...eventLog)
      .addEventLog(...eventLog2)
      .addEventLog(...eventLog3);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      testCreateFinding(
        new BigNumber(size.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        new BigNumber(realisedPnl.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        key,
        TEST_GMX_VAULT
      ),
      testCreateFinding(
        new BigNumber(size2.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        new BigNumber(realisedPnl2.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        key2,
        TEST_GMX_VAULT
      ),
      testCreateFinding(
        new BigNumber(size3.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        new BigNumber(realisedPnl3.toString()).dividedBy(10 ** TEST_PRICE_PRECISION),
        key3,
        TEST_GMX_VAULT
      ),
    ]);
  });
});
