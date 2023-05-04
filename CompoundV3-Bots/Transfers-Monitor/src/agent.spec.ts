import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { SUPPLY_ABI, TRANSFER_ABI, BUY_COLLATERAL_ABI } from "./constants";
import { provideHandleTransaction } from "./agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { Interface } from "ethers/lib/utils";

function mockCreateTransferFinding(
  comet: string,
  sender: string,
  amount: number | string
): Finding {
  return Finding.from({
    name: "Base token transfer on Comet contract",
    description:
      "A base token transfer was done to a Comet contract, without a matching Supply, BuyCollateral action",
    alertId: "COMP2-3",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      cometContract: comet,
      sender,
      transferAmount: amount.toString(),
    },
  });
}

const mockGetFn = (id: string) => {
  if (id == "cometAddresses") return TEST_ADDRESSES;
  else return BASE_TOKENS;
};

const TEST_ADDRESSES = [
  createAddress("0x11"),
  createAddress("0x12"),
  createAddress("0x13"),
  createAddress("0x14"),
];
const BASE_TOKENS = [
  createAddress("0x21"),
  createAddress("0x22"),
  createAddress("0x23"),
  createAddress("0x24"),
];
const TEST_USERS = [
  createAddress("0x31"),
  createAddress("0x32"),
  createAddress("0x33"),
  createAddress("0x34"),
];

// const mockProvider: MockEthersProvider = new MockEthersProvider();
const TRANSFER_IFACE = new Interface([TRANSFER_ABI]);
const COMET_IFACE = new Interface([SUPPLY_ABI, BUY_COLLATERAL_ABI]);

const mockNetworkManager = {
  cometAddresses: TEST_ADDRESSES,
  networkMap: {},
  setNetwork: jest.fn(),
  get: mockGetFn as any,
};

describe("COMP2 - Transfers Monitor Bot Tests suite", () => {
  let handleTransaction: HandleTransaction;

  beforeEach(async () => {
    handleTransaction = provideHandleTransaction(mockNetworkManager as any);
  });

  it("returns empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer happens in a non-baseToken contract", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 200]
    );
    const txEvent: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        createAddress("0xffe"),
        transferEventLog.data,
        ...transferEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer happens in a baseToken of a different comet contract", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 200]
    );
    const txEvent: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        BASE_TOKENS[1],
        transferEventLog.data,
        ...transferEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer target is not a comet contract", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], createAddress("0xffa"), 200]
    );
    const txEvent: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        BASE_TOKENS[0],
        transferEventLog.data,
        ...transferEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer event was emitted with matching Supply event", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 500]
    );
    const supplyEventLog = COMET_IFACE.encodeEventLog(
      COMET_IFACE.getEvent("Supply"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 500]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        BASE_TOKENS[0],
        transferEventLog.data,
        ...transferEventLog.topics
      )
      .addAnonymousEventLog(
        TEST_ADDRESSES[0],
        supplyEventLog.data,
        ...supplyEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer event was emitted with matching BuyCollateral event", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 500]
    );
    const buyCollateralEventLog = COMET_IFACE.encodeEventLog(
      COMET_IFACE.getEvent("BuyCollateral"),
      [TEST_USERS[0], BASE_TOKENS[1], 500, 0]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        TRANSFER_ABI,
        BASE_TOKENS[0],
        transferEventLog.data,
        ...transferEventLog.topics
      )
      .addEventLog(
        BUY_COLLATERAL_ABI,
        TEST_ADDRESSES[0],
        buyCollateralEventLog.data,
        ...buyCollateralEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns a finding if Transfer event was emitted with no Supply BuyCollateral events", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 500]
    );
    const txEvent: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        BASE_TOKENS[0],
        transferEventLog.data,
        ...transferEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      mockCreateTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 500),
    ]);
  });

  it("returns a finding if Transfer event was emitted with matching Supply event but different amount", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 500]
    );
    const supplyEventLog = COMET_IFACE.encodeEventLog(
      COMET_IFACE.getEvent("Supply"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 200]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        BASE_TOKENS[0],
        transferEventLog.data,
        ...transferEventLog.topics
      )
      .addAnonymousEventLog(
        TEST_ADDRESSES[0],
        supplyEventLog.data,
        ...supplyEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      mockCreateTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 500),
    ]);
  });

  it("returns a finding if Transfer event was emitted with matching BuyCollateral event but different amount", async () => {
    const transferEventLog = TRANSFER_IFACE.encodeEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 500]
    );
    const buyCollateralEventLog = COMET_IFACE.encodeEventLog(
      COMET_IFACE.getEvent("BuyCollateral"),
      [TEST_USERS[0], BASE_TOKENS[1], 200, 0]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        BASE_TOKENS[0],
        transferEventLog.data,
        ...transferEventLog.topics
      )
      .addAnonymousEventLog(
        TEST_ADDRESSES[0],
        buyCollateralEventLog.data,
        ...buyCollateralEventLog.topics
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      mockCreateTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 500),
    ]);
  });

  it("returns one finding when multiple transfers happen but one does not have a Supply/BuyCollateral matching event", async () => {
    for (let i = 0; i < TEST_ADDRESSES.length; i++) {
      const transferEventLog1 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[0], TEST_ADDRESSES[i], 500]
      );
      const transferEventLog2 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[1], TEST_ADDRESSES[i], 600]
      );
      const transferEventLog3 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[2], TEST_ADDRESSES[i], 700]
      );
      const transferEventLog4 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[3], TEST_ADDRESSES[i], 800]
      );
      const supplyEventLog1 = COMET_IFACE.encodeEventLog(
        COMET_IFACE.getEvent("Supply"),
        [TEST_USERS[0], TEST_ADDRESSES[i], 500]
      );

      const supplyEventLog2 = COMET_IFACE.encodeEventLog(
        COMET_IFACE.getEvent("Supply"),
        [TEST_USERS[1], TEST_ADDRESSES[i], 600]
      );

      const buyCollateralEventLog = COMET_IFACE.encodeEventLog(
        COMET_IFACE.getEvent("BuyCollateral"),
        [TEST_USERS[2], BASE_TOKENS[0], 700, 0]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog1.data,
          ...transferEventLog1.topics
        )
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog2.data,
          ...transferEventLog2.topics
        )
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog3.data,
          ...transferEventLog3.topics
        )
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog4.data,
          ...transferEventLog4.topics
        )
        .addAnonymousEventLog(
          TEST_ADDRESSES[i],
          supplyEventLog1.data,
          ...supplyEventLog1.topics
        )
        .addAnonymousEventLog(
          TEST_ADDRESSES[i],
          supplyEventLog2.data,
          ...supplyEventLog2.topics
        )
        .addAnonymousEventLog(
          TEST_ADDRESSES[i],
          buyCollateralEventLog.data,
          ...buyCollateralEventLog.topics
        );

      expect(await handleTransaction(txEvent)).toStrictEqual([
        mockCreateTransferFinding(TEST_ADDRESSES[i], TEST_USERS[3], 800),
      ]);
    }
  });

  it("returns multiple findings for different Transfer events", async () => {
    for (let i = 0; i < TEST_ADDRESSES.length; i++) {
      const transferEventLog1 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[0], TEST_ADDRESSES[i], 500]
      );
      const transferEventLog2 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[0], TEST_ADDRESSES[i], 500]
      );
      const transferEventLog3 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[2], TEST_ADDRESSES[i], 700]
      );
      const transferEventLog4 = TRANSFER_IFACE.encodeEventLog(
        TRANSFER_IFACE.getEvent("Transfer"),
        [TEST_USERS[3], TEST_ADDRESSES[i], 800]
      );
      const supplyEventLog1 = COMET_IFACE.encodeEventLog(
        COMET_IFACE.getEvent("Supply"),
        [TEST_USERS[0], TEST_ADDRESSES[i], 500]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog1.data,
          ...transferEventLog1.topics
        )
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog2.data,
          ...transferEventLog2.topics
        )
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog3.data,
          ...transferEventLog3.topics
        )
        .addAnonymousEventLog(
          BASE_TOKENS[i],
          transferEventLog4.data,
          ...transferEventLog4.topics
        )
        .addAnonymousEventLog(
          TEST_ADDRESSES[i],
          supplyEventLog1.data,
          ...supplyEventLog1.topics
        );

      expect(await handleTransaction(txEvent)).toStrictEqual([
        mockCreateTransferFinding(TEST_ADDRESSES[i], TEST_USERS[0], 500),
        mockCreateTransferFinding(TEST_ADDRESSES[i], TEST_USERS[2], 700),
        mockCreateTransferFinding(TEST_ADDRESSES[i], TEST_USERS[3], 800),
      ]);
    }
  });
});
