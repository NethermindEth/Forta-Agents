import {
  ethers,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Network,
} from "forta-agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createChecksumAddress, NetworkManager } from "forta-agent-tools";

import { provideInitialize, provideHandleTransaction } from "./agent";
import { AgentConfig, NetworkData } from "./utils";
import { APPROVAL_ABI, PAUSE_ACTION_ABI, WITHDRAW_RESERVES_ABI } from "./constants";

function createPauseActionFinding(
  comet: string,
  supplyPaused: boolean,
  transferPaused: boolean,
  withdrawPaused: boolean,
  absorbPaused: boolean,
  buyPaused: boolean,
  chainId: number
): Finding {
  return Finding.from({
    name: "Pause action on Comet contract",
    description: "A pause action was executed in a Comet contract",
    alertId: "COMP2-2-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      chain: Network[chainId],
      comet,
      supplyPaused: supplyPaused.toString(),
      transferPaused: transferPaused.toString(),
      withdrawPaused: withdrawPaused.toString(),
      absorbPaused: absorbPaused.toString(),
      buyPaused: buyPaused.toString(),
    },
    addresses: [comet],
  });
}

function createWithdrawReservesFinding(
  comet: string,
  to: string,
  amount: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Withdraw reserves action on Comet contract",
    description: "A withdraw reserves action was executed in a Comet contract",
    alertId: "COMP2-2-2",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId],
      comet,
      to,
      amount: amount.toString(),
    },
    addresses: [comet, to],
  });
}

function createApproveFinding(
  comet: string,
  token: string,
  spender: string,
  amount: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Token approval from Comet contract",
    description: "A token approval was emitted from a Comet contract",
    alertId: "COMP2-2-3",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId],
      comet,
      token,
      spender,
      amount: amount.toString(),
    },
    addresses: [token, comet, spender],
  });
}

const addr = createChecksumAddress;
const COMET_ADDRESSES = [addr("0x1"), addr("0x2")];
const TOKEN_ADDRESS = addr("0x3");
const IRRELEVANT_ADDRESS = addr("0x4");

const network = Network.MAINNET;

const DEFAULT_CONFIG: AgentConfig = {
  [network]: {
    cometAddresses: COMET_ADDRESSES,
  },
};

describe("Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(network);

    provider = mockProvider as unknown as ethers.providers.Provider;

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    const initialize = provideInitialize(networkManager, provider);

    await initialize();

    handleTransaction = provideHandleTransaction(networkManager);
  });

  it("should correctly get the network data", async () => {
    expect(networkManager.getNetwork()).toStrictEqual(network);
    expect(networkManager.get("cometAddresses")).toStrictEqual(DEFAULT_CONFIG[Network.MAINNET].cometAddresses);
  });

  it("should return empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore some target events emitted from other contracts", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    txEvent.addEventLog(PAUSE_ACTION_ABI, IRRELEVANT_ADDRESS, [false, false, false, false, false]);
    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, IRRELEVANT_ADDRESS, [addr("0x0"), 0]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore other events emitted from target contracts", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    COMET_ADDRESSES.forEach((comet) => {
      txEvent.addEventLog("event SomeEvent(uint256 arg)", comet, [0]);
    });

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return a finding if there's a PauseAction emission from a Comet contract", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const supplyPaused = true;
    const transferPaused = false;
    const withdrawPaused = true;
    const absorbPaused = false;
    const buyPaused = true;
    const expectedFinding = createPauseActionFinding(
      comet,
      supplyPaused,
      transferPaused,
      withdrawPaused,
      absorbPaused,
      buyPaused,
      network
    );

    txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [
      supplyPaused,
      transferPaused,
      withdrawPaused,
      absorbPaused,
      buyPaused,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([expectedFinding]);
  });

  it("should return a finding if there's a WithdrawReserves emission from a Comet contract", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const to = addr("0xdef1");
    const amount = 1000;
    const expectedFinding = createWithdrawReservesFinding(comet, to, amount, network);

    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [to, amount]);

    expect(await handleTransaction(txEvent)).toStrictEqual([expectedFinding]);
  });

  it("should not return a finding if there's an Approval emission and the owner is not a Comet contract", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const token = TOKEN_ADDRESS;
    const owner = IRRELEVANT_ADDRESS;
    const spender = addr("0xdef1");
    const amount = 1000;

    txEvent.addEventLog(APPROVAL_ABI, token, [owner, spender, amount]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return a finding if there's an Approval emission and the owner is a Comet contract", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const token = TOKEN_ADDRESS;
    const owner = comet;
    const spender = addr("0xdef1");
    const amount = 1000;
    const expectedFinding = createApproveFinding(comet, token, spender, amount, network);

    txEvent.addEventLog(APPROVAL_ABI, token, [owner, spender, amount]);

    expect(await handleTransaction(txEvent)).toStrictEqual([expectedFinding]);
  });

  it("should return multiple findings if there's multiple events", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const expectedFindings = [];

    {
      const supplyPaused = true;
      const transferPaused = false;
      const withdrawPaused = true;
      const absorbPaused = false;
      const buyPaused = true;
      expectedFindings.push(
        createPauseActionFinding(comet, supplyPaused, transferPaused, withdrawPaused, absorbPaused, buyPaused, network)
      );
      txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [
        supplyPaused,
        transferPaused,
        withdrawPaused,
        absorbPaused,
        buyPaused,
      ]);
    }
    {
      const supplyPaused = false;
      const transferPaused = true;
      const withdrawPaused = false;
      const absorbPaused = true;
      const buyPaused = false;
      expectedFindings.push(
        createPauseActionFinding(comet, supplyPaused, transferPaused, withdrawPaused, absorbPaused, buyPaused, network)
      );
      txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [
        supplyPaused,
        transferPaused,
        withdrawPaused,
        absorbPaused,
        buyPaused,
      ]);
    }
    {
      const to = addr("0xdef1");
      const amount = 1000;
      expectedFindings.push(createWithdrawReservesFinding(comet, to, amount, network));
      txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [to, amount]);
    }
    {
      const to = addr("0xf00d");
      const amount = 2000;
      expectedFindings.push(createWithdrawReservesFinding(comet, to, amount, network));
      txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [to, amount]);
    }
    {
      const token = TOKEN_ADDRESS;
      const owner = comet;
      const spender = addr("0xdef1");
      const amount = 1000;
      expectedFindings.push(createApproveFinding(comet, token, spender, amount, network));
      txEvent.addEventLog(APPROVAL_ABI, token, [owner, spender, amount]);
    }
    {
      const token = addr("0xdef1");
      const owner = comet;
      const spender = addr("0xf00d");
      const amount = 2000;
      expectedFindings.push(createApproveFinding(comet, token, spender, amount, network));
      txEvent.addEventLog(APPROVAL_ABI, token, [owner, spender, amount]);
    }

    expect(await handleTransaction(txEvent)).toStrictEqual(expectedFindings);
  });

  it("should link findings to the correct comet address", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const expectedFindings = [];

    {
      const comet = COMET_ADDRESSES[0];
      const supplyPaused = true;
      const transferPaused = false;
      const withdrawPaused = true;
      const absorbPaused = false;
      const buyPaused = true;
      expectedFindings.push(
        createPauseActionFinding(comet, supplyPaused, transferPaused, withdrawPaused, absorbPaused, buyPaused, network)
      );
      txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [
        supplyPaused,
        transferPaused,
        withdrawPaused,
        absorbPaused,
        buyPaused,
      ]);
    }
    {
      const comet = COMET_ADDRESSES[1];
      const supplyPaused = false;
      const transferPaused = true;
      const withdrawPaused = false;
      const absorbPaused = true;
      const buyPaused = false;
      expectedFindings.push(
        createPauseActionFinding(comet, supplyPaused, transferPaused, withdrawPaused, absorbPaused, buyPaused, network)
      );
      txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [
        supplyPaused,
        transferPaused,
        withdrawPaused,
        absorbPaused,
        buyPaused,
      ]);
    }
    {
      const comet = COMET_ADDRESSES[1];
      const to = addr("0xdef1");
      const amount = 1000;
      expectedFindings.push(createWithdrawReservesFinding(comet, to, amount, network));
      txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [to, amount]);
    }
    {
      const comet = COMET_ADDRESSES[0];
      const to = addr("0xf00d");
      const amount = 2000;
      expectedFindings.push(createWithdrawReservesFinding(comet, to, amount, network));
      txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [to, amount]);
    }
    {
      const comet = COMET_ADDRESSES[0];
      const token = TOKEN_ADDRESS;
      const owner = comet;
      const spender = addr("0xdef1");
      const amount = 1000;
      expectedFindings.push(createApproveFinding(comet, token, spender, amount, network));
      txEvent.addEventLog(APPROVAL_ABI, token, [owner, spender, amount]);
    }
    {
      const comet = COMET_ADDRESSES[1];
      const token = addr("0xdef1");
      const owner = comet;
      const spender = addr("0xf00d");
      const amount = 2000;
      expectedFindings.push(createApproveFinding(comet, token, spender, amount, network));
      txEvent.addEventLog(APPROVAL_ABI, token, [owner, spender, amount]);
    }

    expect(await handleTransaction(txEvent)).toStrictEqual(expectedFindings);
  });
});