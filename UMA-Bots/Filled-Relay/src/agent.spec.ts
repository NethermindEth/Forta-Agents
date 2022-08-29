import { Finding, HandleTransaction, ethers } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { FUNC_ABI, FILLED_RELAY_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./config";
import bot from "./agent";
import { createFinding } from "./findings";
import { BigNumber } from "ethers";

describe("funds deposited bot", () => {
  const TOKEN_IFACE = new ethers.utils.Interface(FUNC_ABI);

  const MOCK_CONTRACT_ADDRESS = createAddress("0x1234");

  const MOCK_NETWORK_ID = 1111;

  let handleTransaction: HandleTransaction;

  let mockTxEvent: TestTransactionEvent;

  let networkManager: NetworkManager<NetworkData>;

  let eventFragment: ethers.utils.EventFragment;

  let mockEventFragment: ethers.utils.EventFragment;

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
    mockTxEvent.setBlock(1234);

    mockProvider = new MockEthersProvider();

    mockProvider.addCallTo(MOCK_TOKEN_ADDRESS, mockTxEvent.blockNumber, TOKEN_IFACE, "name", {
      inputs: [],
      outputs: ["Test Token"],
    });

    mockProvider.addCallTo(MOCK_TOKEN_ADDRESS, mockTxEvent.blockNumber, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [0],
    });

    handleTransaction = bot.provideHandleTransaction(networkManager, mockProvider as any);
  });

  beforeAll(() => {
    eventFragment = ethers.utils.EventFragment.from(FILLED_RELAY_EVENT.slice("event ".length));
    mockEventFragment = ethers.utils.EventFragment.from("MockEvent(uint256)");
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
      false
    ];

    mockTxEvent.addEventLog(eventFragment, createAddress("0x7777"), data);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if there is a FilledRelay event emitted", async () => {
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
      false
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    const findings: Finding[] = await handleTransaction(mockTxEvent);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer:  createAddress("0x6473")
    };

    expect(findings).toStrictEqual([createFinding(metadata, false)]);
  });

  it("returns multiple finding if there are FilledRelay events emitted", async () => {
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
      false
    ];

    const data2 = [
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
      createAddress("0x1111"),
      createAddress("0x5432"),
      createAddress("0x2345"),
      true
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data2);
    const findings: Finding[] = await handleTransaction(mockTxEvent);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer:  createAddress("0x6473")
    };

    const metadata2 = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x2345"),
      depositor: createAddress("0x5432"),
      relayer:  createAddress("0x1111")
    };

    expect(findings).toStrictEqual([createFinding(metadata, false), createFinding(metadata2, true)]);
  });

  it("returns a finding if there is a FilledRelay event emitted and ignores other events", async () => {
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
      false
    ];

    mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
    mockTxEvent.addEventLog(mockEventFragment, MOCK_CONTRACT_ADDRESS, [234])
    const findings: Finding[] = await handleTransaction(mockTxEvent);

    const metadata = {
      amount: amount.toString(),
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      tokenName: "Test Token",
      recipient: createAddress("0x0001"),
      depositor: createAddress("0x0021"),
      relayer:  createAddress("0x6473")
    };

    expect(findings).toStrictEqual([createFinding(metadata, false)]);
  });

  

  
});
