import { Finding, HandleTransaction, ethers } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { FUNC_ABI, FILLED_RELAY_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./config";
import bot from "./agent";
import { createFinding, FINDING_PARAMETERS } from "./findings";
import { BigNumber } from "ethers";
import LRU from "lru-cache";

describe("Multiple relays detection bot test suite", () => {
  const TOKEN_IFACE = new ethers.utils.Interface(FUNC_ABI);

  const MOCK_CONTRACT_ADDRESS = createAddress("0x1234");

  const MOCK_NETWORK_ID = 1111;

  const INITIAL_TIMESTAMP = 1661818596;

  const eventFragment: ethers.utils.EventFragment = ethers.utils.EventFragment.from(
    FILLED_RELAY_EVENT.slice("event ".length)
  );

  const mockEventFragment: ethers.utils.EventFragment = ethers.utils.EventFragment.from("MockEvent(uint256)");

  let handleTransaction: HandleTransaction;

  let mockTxEvent: TestTransactionEvent;
  let mockTxEvent2: TestTransactionEvent;

  let networkManager: NetworkManager<NetworkData>;

  let mockProvider: MockEthersProvider;

  const MOCK_TOKEN_ADDRESS = createAddress("0x1234");

  beforeEach(() => {
    const mockData: Record<number, NetworkData> = {
      [MOCK_NETWORK_ID]: {
        spokePoolAddress: MOCK_CONTRACT_ADDRESS,
      },
    };

    //initialize network manager with mock network
    networkManager = new NetworkManager(mockData, MOCK_NETWORK_ID);

    //create test transaction before each test
    mockTxEvent = new TestTransactionEvent();
    mockTxEvent2 = new TestTransactionEvent();
    mockTxEvent.setBlock(1234);
    mockTxEvent2.setBlock(1235);

    mockTxEvent.setTimestamp(INITIAL_TIMESTAMP);

    mockProvider = new MockEthersProvider();

    mockProvider.addCallTo(MOCK_TOKEN_ADDRESS, mockTxEvent.blockNumber, TOKEN_IFACE, "name", {
      inputs: [],
      outputs: ["Test Token"],
    });

    mockProvider.addCallTo(MOCK_TOKEN_ADDRESS, mockTxEvent.blockNumber, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [0],
    });

    handleTransaction = bot.provideHandleTransaction(
      networkManager,
      mockProvider as any,
      new LRU<string, { counter: number; timeStamp: number }>({ max: 500 })
    );
  });

  it("returns empty findings if no events are emitted", async () => {
    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events from target contract", async () => {
    mockTxEvent.addEventLog(mockEventFragment, MOCK_CONTRACT_ADDRESS, [123]);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore events from another contract,", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, createAddress("0x7777"), data);
    mockTxEvent.addEventLog(eventFragment, createAddress("0x7777"), data);
    mockTxEvent.addEventLog(eventFragment, createAddress("0x7777"), data);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if an address exceeds the relay threshold in the set time window (same block)", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer: createAddress("0x6473"),
    };

    expect(findings).toStrictEqual([createFinding(metadata, 0)]);
  });

  it("returns a finding if an address exceeds the relay threshold in the set time window (different blocks)", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    const delta = FINDING_PARAMETERS.timeWindow - 1;
    mockTxEvent2.setTimestamp(INITIAL_TIMESTAMP + delta); //set the timestamp of the last tx to 1 second before the time window ends
    await handleTransaction(mockTxEvent);
    const findings: Finding[] = await handleTransaction(mockTxEvent2);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer: createAddress("0x6473"),
    };

    expect(findings).toStrictEqual([createFinding(metadata, delta / 60)]);
  });

  it("does not return a finding if a relayer does not exceed the relay threshold in the set time window", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    const delta = FINDING_PARAMETERS.timeWindow + 1;
    mockTxEvent2.setTimestamp(INITIAL_TIMESTAMP + delta); //set the timestamp of the last tx to 1 second after the time window
    await handleTransaction(mockTxEvent);
    const findings: Finding[] = await handleTransaction(mockTxEvent2);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer: createAddress("0x6473"),
    };

    expect(findings).toStrictEqual([]);
  });

  it("returns finding for relayer that exceeds the threshold but ignores relayer that does not", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    const data2 = [
      amount.mul(2),
      amount.mul(2),
      amount.mul(2),
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6788"),
      createAddress("0x1256"),
      createAddress("0x5878"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);

    const delta = FINDING_PARAMETERS.timeWindow - 1;
    mockTxEvent2.setTimestamp(INITIAL_TIMESTAMP + delta);
    const f: Finding[] = await handleTransaction(mockTxEvent);

    const findings: Finding[] = f.concat(await handleTransaction(mockTxEvent2));

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer: createAddress("0x6473"),
    };

    expect(findings).toStrictEqual([createFinding(metadata, 0)]);
  });

  it("returns multiple findings when relayers exceed relay threshold in set time window", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    const data2 = [
      amount.mul(2),
      amount.mul(2),
      amount.mul(2),
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x1256"),
      createAddress("0x5878"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);

    const delta = FINDING_PARAMETERS.timeWindow;
    mockTxEvent2.setTimestamp(INITIAL_TIMESTAMP + delta);
    const f: Finding[] = await handleTransaction(mockTxEvent);

    const findings: Finding[] = f.concat(await handleTransaction(mockTxEvent2));

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer: createAddress("0x6473"),
    };

    const metadata2 = {
      amount: amount.mul(2).toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x5878"),
      depositor: createAddress("0x1256"),
      relayer: createAddress("0x6473"),
    };

    expect(findings).toStrictEqual([createFinding(metadata, 0), createFinding(metadata2, 0)]);
  });

  it("returns multiple findings when relayers exceed relay threshold in set time window, with transactions in different blocks", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    const data2 = [
      amount.mul(2),
      amount.mul(2),
      amount.mul(2),
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x5090"),
      createAddress("0x1256"),
      createAddress("0x5878"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);

    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    const delta = FINDING_PARAMETERS.timeWindow - 1;
    mockTxEvent2.setTimestamp(INITIAL_TIMESTAMP + delta);
    await handleTransaction(mockTxEvent);

    const findings: Finding[] = await handleTransaction(mockTxEvent2);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer: createAddress("0x6473"),
    };

    const metadata2 = {
      amount: amount.mul(2).toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x5878"),
      depositor: createAddress("0x1256"),
      relayer: createAddress("0x5090"),
    };

    expect(findings).toStrictEqual([createFinding(metadata2, delta / 60), createFinding(metadata, delta / 60)]);
  });

  it("returns finding after relayer exceeds threshold in set time window, after relay counter being reset", async () => {
    const amount = BigNumber.from("10000000");
    const originChainId = MOCK_NETWORK_ID;
    const destinationChainId = 1000;
    const repaymentChainId = 9999;

    const data = [
      amount,
      amount,
      amount,
      repaymentChainId,
      originChainId,
      destinationChainId,
      555,
      666,
      777,
      123,
      MOCK_TOKEN_ADDRESS,
      createAddress("0x6473"),
      createAddress("0x0021"),
      createAddress("0x0001"),
      false,
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent2.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

    const delta = FINDING_PARAMETERS.timeWindow * 2;
    mockTxEvent2.setTimestamp(INITIAL_TIMESTAMP + delta);
    await handleTransaction(mockTxEvent);

    const findings: Finding[] = await handleTransaction(mockTxEvent2);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer: createAddress("0x6473"),
    };

    expect(findings).toStrictEqual([createFinding(metadata, 0)]);
  });
});
