import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideBotHandler } from "./agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";
import { encodeParameter } from "forta-agent-tools/lib/utils";

import NetworkManager from "./network";
import BigNumber from "bignumber.js";

const testCreateFinding = (
  sizeDelta: string,
  key: string,
  account: string,
  isClosed: boolean,
  contractAddress: string
): Finding =>
  isClosed
    ? Finding.fromObject({
        name: "Large size Position closed",
        description: "ClosePosition Event with large size emitted from GMX's Vault contract",
        alertId: "GMX-2-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "GMX",
        metadata: {
          GMX: contractAddress,
          Account: account,
          "Position size": new BigNumber(sizeDelta).toFixed(2),
          "Position key": key,
        },
      })
    : Finding.fromObject({
        name: "Large size decrease in Position",
        description: "DecreasePosition Event with large sizeDelta emitted from GMX's Vault contract",
        alertId: "GMX-2-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "GMX",
        metadata: {
          GMX: contractAddress,
          Account: account,
          "Position decrease": new BigNumber(sizeDelta).toFixed(2),
          "Position key": key,
        },
      });

const TEST_GMX_VAULT = createAddress("0x256H");
const TEST_LARGE_LIMIT = 7000;
const SOME_OTHER_ADDRESS = createAddress("0x578");
const TEST_PRICE_PRECISION = 30;

const createDecreasePositionEvent = (
  vaultAddress: string,
  key: string,
  sizeDelta: ethers.BigNumber,
  account: string
): [string, string, string] => {
  const data = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "address", "address", "address", "uint256", "uint256", "bool", "uint256", "uint256"],
    [key, account, createAddress("0x0"), createAddress("0x0"), 0, sizeDelta, true, 0, 0]
  );
  return ["DecreasePosition(bytes32,address,address,address,uint256,uint256,bool,uint256,uint256)", vaultAddress, data];
};

const createClosePositionEvent = (
  vaultAddress: string,
  key: string,
  size: ethers.BigNumber
): [string, string, string] => {
  const data = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "uint256", "uint256", "uint256", "uint256", "uint256", "int256"],
    [key, size, 0, 0, 0, 0, 0]
  );
  return ["ClosePosition(bytes32,uint256,uint256,uint256,uint256,uint256,int256)", vaultAddress, data];
};

const createSomeOtherEvent = (contractAddress: string, arg1: string): [string, string, string] => {
  const data: string = encodeParameter("uint256", arg1);
  return ["SomeOtherEvent(uint256)", contractAddress, data];
};

describe("closing of a large position or large decrease in an existing position test suite", () => {
  const mockNetworkManager: NetworkManager = {
    vault: TEST_GMX_VAULT,
    setNetwork: jest.fn(),
  };

  const handleTransaction: HandleTransaction = provideBotHandler(TEST_LARGE_LIMIT, mockNetworkManager);

  it("should return empty findings when there are only other events from the vault", async () => {
    const eventLog = createSomeOtherEvent(TEST_GMX_VAULT, "7");
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings when there are DecreasePosition events from other contracts", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const sizeDelta = ethers.BigNumber.from(10000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const eventLog = createDecreasePositionEvent(SOME_OTHER_ADDRESS, key, sizeDelta, createAddress("0x234"));
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings when the DecreasePosition event from TEST_GMX_VAULT isn't large", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const sizeDelta = ethers.BigNumber.from(7000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const account = createAddress("0x234");
    const eventLog = createDecreasePositionEvent(TEST_GMX_VAULT, key, sizeDelta, account);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a decrease Position finding when only a DecreasePosition event is emitted from TEST_GMX_VAULT", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const sizeDelta = ethers.BigNumber.from(10000435).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION - 3));
    const account = createAddress("0x234");
    const eventLog = createDecreasePositionEvent(TEST_GMX_VAULT, key, sizeDelta, account);
    let txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(...eventLog);
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding("10000.435", key, account, false, TEST_GMX_VAULT)]);

    // should still return a decrease finding when there's a close event from another contract

    const closeEventFromAnotherContract = createClosePositionEvent(SOME_OTHER_ADDRESS, key, sizeDelta);

    txEvent = new TestTransactionEvent().addEventLog(...eventLog).addEventLog(...closeEventFromAnotherContract);
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding("10000.435", key, account, false, TEST_GMX_VAULT)]);
  });

  it("should return a close Position finding when a closePosition event is also emitted from TEST_GMX_VAULT", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const sizeDelta = ethers.BigNumber.from(10000435).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION - 3));
    const account = createAddress("0x234");

    const decreaseEventLog = createDecreasePositionEvent(TEST_GMX_VAULT, key, sizeDelta, account);

    const closeEventLog = createClosePositionEvent(TEST_GMX_VAULT, key, sizeDelta);
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(...decreaseEventLog)
      .addEventLog(...closeEventLog);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding("10000.435", key, account, true, TEST_GMX_VAULT)]);
  });

  it("should return the correct finding based on the closePosition event arguments", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const key1 = ethers.utils.formatBytes32String("positionKey1");
    const sizeDelta = ethers.BigNumber.from(9001).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const sizeDelta1 = ethers.BigNumber.from(8500).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const account = createAddress("0x234");

    const decreaseEventLog = createDecreasePositionEvent(TEST_GMX_VAULT, key, sizeDelta, account);

    let closeEventLog = createClosePositionEvent(
      TEST_GMX_VAULT,
      key1, // different key from the decrease event above,hence the close event isnt for the decrease event.
      sizeDelta
    );
    let txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(...decreaseEventLog)
      .addEventLog(...closeEventLog);
    let findings: Finding[] = await handleTransaction(txEvent);

    // should return a decrease position finding
    expect(findings).toStrictEqual([testCreateFinding("9001", key, account, false, TEST_GMX_VAULT)]);

    closeEventLog = createClosePositionEvent(
      TEST_GMX_VAULT,
      key,
      sizeDelta1 // different size from the decrease event above i.e doesn't belong to the decrease event
    );

    txEvent = new TestTransactionEvent().addEventLog(...decreaseEventLog).addEventLog(...closeEventLog);
    findings = await handleTransaction(txEvent);

    // should return a decrease position finding
    expect(findings).toStrictEqual([testCreateFinding("9001", key, account, false, TEST_GMX_VAULT)]);

    closeEventLog = createClosePositionEvent(TEST_GMX_VAULT, key, sizeDelta);

    txEvent = new TestTransactionEvent().addEventLog(...decreaseEventLog).addEventLog(...closeEventLog);
    findings = await handleTransaction(txEvent);

    //correct closePosition event arguments, should return close position finding
    expect(findings).toStrictEqual([testCreateFinding("9001", key, account, true, TEST_GMX_VAULT)]);
  });

  it("should return multiple findings correctly when there are multiple events for the same position", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const sizeDelta = ethers.BigNumber.from(800543).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION - 2));
    const sizeDelta1 = ethers.BigNumber.from(5000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const sizeDelta2 = ethers.BigNumber.from(7674).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const account = createAddress("0x234");

    const decreaseEventLog = createDecreasePositionEvent(TEST_GMX_VAULT, key, sizeDelta, account);
    const decreaseEventLog1 = createDecreasePositionEvent(
      TEST_GMX_VAULT,
      key,
      sizeDelta1, // size delta is less than limit, won't return a finding
      account
    );
    const decreaseEventLog2 = createDecreasePositionEvent(TEST_GMX_VAULT, key, sizeDelta2, account);
    // only decreaseEventLog2 is a close event
    const closeEventLog2 = createClosePositionEvent(TEST_GMX_VAULT, key, sizeDelta2);
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(...decreaseEventLog)
      .addEventLog(...decreaseEventLog1)
      .addEventLog(...decreaseEventLog2)
      .addEventLog(...closeEventLog2);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      testCreateFinding("8005.43", key, account, false, TEST_GMX_VAULT),
      testCreateFinding("7674", key, account, true, TEST_GMX_VAULT),
    ]);
  });

  it("should return multiple findings correctly when there are multiple events for different positions", async () => {
    const key = ethers.utils.formatBytes32String("positionKey");
    const key1 = ethers.utils.formatBytes32String("positionKey1");
    const key2 = ethers.utils.formatBytes32String("positionKey1");
    const sizeDelta = ethers.BigNumber.from(90053).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION - 1));
    const sizeDelta1 = ethers.BigNumber.from(8000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const sizeDelta2 = ethers.BigNumber.from(7674).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_PRECISION));
    const account = createAddress("0x234");

    const decreaseEventLog = createDecreasePositionEvent(TEST_GMX_VAULT, key, sizeDelta, account);
    const decreaseEventLog1 = createDecreasePositionEvent(
      TEST_GMX_VAULT,
      key1, //different key, another position.
      sizeDelta1,
      account
    );

    const decreaseEventLog2 = createDecreasePositionEvent(
      TEST_GMX_VAULT,
      key2, //different key, another position.
      sizeDelta2,
      account
    );

    // close event for decreaseEventLog1
    const closeEventLog1 = createClosePositionEvent(TEST_GMX_VAULT, key1, sizeDelta1);

    // close event for decreaseEventLog2
    const closeEventLog2 = createClosePositionEvent(TEST_GMX_VAULT, key2, sizeDelta2);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(...decreaseEventLog)
      .addEventLog(...decreaseEventLog1)
      .addEventLog(...decreaseEventLog2)
      .addEventLog(...closeEventLog1)
      .addEventLog(...closeEventLog2);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      testCreateFinding("9005.3", key, account, false, TEST_GMX_VAULT),
      testCreateFinding("8000", key1, account, true, TEST_GMX_VAULT),
      testCreateFinding("7674", key2, account, true, TEST_GMX_VAULT),
    ]);
  });
});
