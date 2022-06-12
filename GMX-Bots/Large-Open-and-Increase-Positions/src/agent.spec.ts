import { Finding, ethers, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideTransactionHandler } from "./agent";
import NetworkData from "./network";
import { VAULT_CONSTANTS } from "./constants";
import { ethersBnToBn } from "./utils";

const { INCREASE_POSITION_EVENT, UPDATE_POSITION_EVENT, THRESHOLD } = VAULT_CONSTANTS;
const TEST_PRICE_MULTIPLIER = 30;
const MOCK_OTHER_EVENT: string = "event UpdateFundingRate(address token, uint256 fundingRate)";
const MOCK_EVENT_ABI: string[] = [INCREASE_POSITION_EVENT, UPDATE_POSITION_EVENT];

type mockConstantsType = {
  MOCK_VAULT_ADDRESS: string;
  MOCK_OTHER_CONTRACT: string;
  MOCK_ACCOUNT: string;
  MOCK_TOKEN: string;
  MOCK_IFACE: ethers.utils.Interface;
};

const MOCK_CONSTANTS: mockConstantsType = {
  MOCK_VAULT_ADDRESS: createAddress("0xa1"),
  MOCK_OTHER_CONTRACT: createAddress("0x99"),
  MOCK_ACCOUNT: createAddress("0x11a"),
  MOCK_TOKEN: createAddress("0x85e"),
  MOCK_IFACE: new ethers.utils.Interface(MOCK_EVENT_ABI),
};

const { MOCK_VAULT_ADDRESS, MOCK_OTHER_CONTRACT, MOCK_IFACE, MOCK_ACCOUNT, MOCK_TOKEN } = MOCK_CONSTANTS;

const eventParams = {
  updatePositionKey: ethers.utils.formatBytes32String("key1"),
  increasePositionKey: ethers.utils.formatBytes32String("key2"),
  largeSizeDelta: ethers.BigNumber.from(50000000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3)),
  smallSizeDelta: ethers.BigNumber.from(100).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER)),
  largePositionSize: ethers.BigNumber.from(50000000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3)),
  largePositionSize2: ethers.BigNumber.from(600000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3)),
  smallPositionSize: ethers.BigNumber.from(100).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER)),
};

const {
  updatePositionKey,
  increasePositionKey,
  largeSizeDelta,
  smallSizeDelta,
  smallPositionSize,
  largePositionSize,
  largePositionSize2,
} = eventParams;

const mockCreateFinding = (
  account: string,
  vaultAddress: string,
  updatePositionKey: string,
  increasePositionKey: string,
  size: ethers.BigNumber,
  sizeDelta: ethers.BigNumber,
  positionSizeDifference: ethers.BigNumber
): Finding => {
  if (ethers.BigNumber.from(updatePositionKey).eq(increasePositionKey) && ethers.BigNumber.from(size).eq(sizeDelta)) {
    return Finding.fromObject({
      name: "Large position size opened on GMX's Vault Contract",
      description: "UpdatePosition event emitted with a large position size",
      alertId: "GMX-1-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "GMX",
      metadata: {
        gmxVault: vaultAddress,
        account: account,
        positionSize: ethersBnToBn(sizeDelta, 30).decimalPlaces(2).toString(),
        positionKey: updatePositionKey,
      },
    });
  } else {
    return Finding.fromObject({
      name: "Existing large position increased on GMX's Vault Contract",
      description: "IncreasePosition event emitted in an existing large position on GMX's Vault Contract",
      alertId: "GMX-1-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "GMX",
      metadata: {
        gmxVault: vaultAddress,
        account: account,
        initialPositionSize: ethersBnToBn(sizeDelta, 30).decimalPlaces(2).toString(),
        positionIncrementSize: ethersBnToBn(positionSizeDifference, 30).decimalPlaces(2).toString(),
        finalPositionSize: ethersBnToBn(size, 30).decimalPlaces(2).toString(),
        positionKey: increasePositionKey,
      },
    });
  }
};

describe("Large Opened and Increased Positions Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let txEvent: TransactionEvent;
  let findings: Finding[];
  const increasePositionEventFragment: ethers.utils.EventFragment = MOCK_IFACE.getEvent("IncreasePosition");
  const updatePositionEventFragment: ethers.utils.EventFragment = MOCK_IFACE.getEvent("UpdatePosition");

  const mockNetworkManager: NetworkData = {
    vaultAddress: MOCK_VAULT_ADDRESS,
    networkMap: {},
    setNetwork: jest.fn(),
  };

  beforeAll(() => {
    handleTransaction = provideTransactionHandler(
      mockNetworkManager,
      THRESHOLD,
      UPDATE_POSITION_EVENT,
      INCREASE_POSITION_EVENT
    );
  });

  it("should return no finding in empty transaction", async () => {
    txEvent = new TestTransactionEvent();

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other emitted events from Vault Contract", async () => {
    const unsupportedIFACE = new ethers.utils.Interface([MOCK_OTHER_EVENT]);
    const unsupportedEventLog = MOCK_IFACE.encodeEventLog(unsupportedIFACE.getEvent("UpdateFundingRate"), [
      createAddress("0x0009"),
      0,
    ]);
    txEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.vaultAddress,
      unsupportedEventLog.data,
      ...unsupportedEventLog.topics
    );

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore IncreasePosition emitted from a different contract ", async () => {
    const increasePositionEventLog = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      increasePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      largeSizeDelta,
      true,
      0,
      0,
    ]);

    txEvent = new TestTransactionEvent()
      .setTo(MOCK_OTHER_CONTRACT)
      .addAnonymousEventLog(MOCK_OTHER_CONTRACT, increasePositionEventLog.data, ...increasePositionEventLog.topics);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore UpdatePosition emitted from a different contract ", async () => {
    const updatePositionEventLog = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      updatePositionKey,
      largePositionSize,
      0,
      0,
      0,
      0,
      0,
    ]);

    txEvent = new TestTransactionEvent()
      .setTo(MOCK_OTHER_CONTRACT)
      .addAnonymousEventLog(MOCK_OTHER_CONTRACT, updatePositionEventLog.data, ...updatePositionEventLog.topics);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore event emissions whose size delta is not large", async () => {
    const increasePositionEventLog = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      increasePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      smallSizeDelta,
      true,
      0,
      0,
    ]);

    const updatePositionEventLog = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      updatePositionKey,
      smallPositionSize,
      0,
      0,
      0,
      0,
      0,
    ]);

    txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog.data,
        ...increasePositionEventLog.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog.data,
        ...updatePositionEventLog.topics
      );

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect finding for IncreasePosition event whose size delta is large", async () => {
    const increasePositionEventLog = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      updatePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      largeSizeDelta,
      true,
      0,
      0,
    ]);

    const updatePositionEventLog = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      increasePositionKey,
      largePositionSize2,
      0,
      0,
      0,
      0,
      0,
    ]);

    txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog.data,
        ...increasePositionEventLog.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog.data,
        ...updatePositionEventLog.topics
      );

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding(
        MOCK_ACCOUNT,
        mockNetworkManager.vaultAddress,
        updatePositionKey,
        updatePositionKey,
        largePositionSize2,
        largeSizeDelta,
        ethers.BigNumber.from(largePositionSize2).sub(ethers.BigNumber.from(largeSizeDelta))
      ),
    ]);
  });

  it("should detect finding for UpdatePosition event whose position size is large", async () => {
    const increasePositionEventLog = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      updatePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      largeSizeDelta,
      true,
      0,
      0,
    ]);

    const updatePositionEventLog = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      updatePositionKey,
      largePositionSize,
      0,
      0,
      0,
      0,
      0,
    ]);

    txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog.data,
        ...updatePositionEventLog.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog.data,
        ...increasePositionEventLog.topics
      );
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding(
        MOCK_ACCOUNT,
        mockNetworkManager.vaultAddress,
        updatePositionKey,
        updatePositionKey,
        largePositionSize,
        largeSizeDelta,
        ethers.BigNumber.from(largePositionSize).sub(ethers.BigNumber.from(largeSizeDelta))
      ),
    ]);
  });

  it("should detect multiple findings for IncreasePosition event whose size delta is large", async () => {
    const positionSize1 = ethers.BigNumber.from(500000000).mul(
      ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3)
    );
    const positionSize2 = ethers.BigNumber.from(600000000).mul(
      ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3)
    );
    const positionSize3 = ethers.BigNumber.from(700000000).mul(
      ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3)
    );

    const sizeDelta1 = ethers.BigNumber.from(50000000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3));
    const sizeDelta2 = ethers.BigNumber.from(60000000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3));
    const sizeDelta3 = ethers.BigNumber.from(70000000).mul(ethers.BigNumber.from(10).pow(TEST_PRICE_MULTIPLIER - 3));

    const increasePositionEventLog1 = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      increasePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      sizeDelta1,
      true,
      0,
      0,
    ]);

    const updatePositionEventLog1 = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      increasePositionKey,
      positionSize1,
      0,
      0,
      0,
      0,
      0,
    ]);

    const increasePositionEventLog2 = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      increasePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      sizeDelta2,
      true,
      0,
      0,
    ]);

    const updatePositionEventLog2 = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      increasePositionKey,
      positionSize2,
      0,
      0,
      0,
      0,
      0,
    ]);

    const increasePositionEventLog3 = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      increasePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      sizeDelta3,
      true,
      0,
      0,
    ]);

    const updatePositionEventLog3 = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      increasePositionKey,
      positionSize3,
      0,
      0,
      0,
      0,
      0,
    ]);

    txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog1.data,
        ...increasePositionEventLog1.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog1.data,
        ...updatePositionEventLog1.topics
      )

      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog2.data,
        ...updatePositionEventLog2.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog2.data,
        ...increasePositionEventLog2.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog3.data,
        ...updatePositionEventLog3.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog3.data,
        ...increasePositionEventLog3.topics
      );

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding(
        MOCK_ACCOUNT,
        mockNetworkManager.vaultAddress,
        increasePositionKey,
        increasePositionKey,
        positionSize1,
        sizeDelta1,
        ethers.BigNumber.from(positionSize1).sub(ethers.BigNumber.from(sizeDelta1))
      ),
      mockCreateFinding(
        MOCK_ACCOUNT,
        mockNetworkManager.vaultAddress,
        increasePositionKey,
        increasePositionKey,
        positionSize2,
        sizeDelta2,
        ethers.BigNumber.from(positionSize2).sub(ethers.BigNumber.from(sizeDelta2))
      ),
      mockCreateFinding(
        MOCK_ACCOUNT,
        mockNetworkManager.vaultAddress,
        increasePositionKey,
        increasePositionKey,
        positionSize3,
        sizeDelta3,
        ethers.BigNumber.from(positionSize3).sub(ethers.BigNumber.from(sizeDelta3))
      ),
    ]);
  });

  it("should detect multiple findings for UpdatePosition event whose position size is large", async () => {
    const increasePositionEventLog1 = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      updatePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      largeSizeDelta,
      true,
      0,
      0,
    ]);

    const updatePositionEventLog1 = MOCK_IFACE.encodeEventLog(updatePositionEventFragment, [
      updatePositionKey,
      largePositionSize,
      0,
      0,
      0,
      0,
      0,
    ]);

    const increasePositionEventLog2 = MOCK_IFACE.encodeEventLog(increasePositionEventFragment, [
      updatePositionKey,
      MOCK_ACCOUNT,
      MOCK_TOKEN,
      MOCK_TOKEN,
      0,
      largeSizeDelta,
      true,
      0,
      0,
    ]);

    txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog1.data,
        ...updatePositionEventLog1.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog1.data,
        ...increasePositionEventLog1.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        updatePositionEventLog1.data,
        ...updatePositionEventLog1.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.vaultAddress,
        increasePositionEventLog2.data,
        ...increasePositionEventLog2.topics
      );

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding(
        MOCK_ACCOUNT,
        mockNetworkManager.vaultAddress,
        updatePositionKey,
        updatePositionKey,
        largePositionSize,
        largeSizeDelta,
        ethers.BigNumber.from(largePositionSize).sub(ethers.BigNumber.from(largeSizeDelta))
      ),
      mockCreateFinding(
        MOCK_ACCOUNT,
        mockNetworkManager.vaultAddress,
        updatePositionKey,
        updatePositionKey,
        largePositionSize,
        largeSizeDelta,
        ethers.BigNumber.from(largePositionSize).sub(ethers.BigNumber.from(largeSizeDelta))
      ),
    ]);
    expect(findings.length).toStrictEqual(2);
  });
});
