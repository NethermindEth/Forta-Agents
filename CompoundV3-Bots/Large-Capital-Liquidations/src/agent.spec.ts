import { ethers, Finding, FindingSeverity, FindingType, HandleBlock, Initialize, Network } from "forta-agent";
import { createChecksumAddress, MulticallProvider, NetworkManager } from "forta-agent-tools";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { Log } from "@ethersproject/abstract-provider";

import { provideInitialize, provideHandleBlock } from "./agent";
import { AgentConfig, AgentState, NetworkData } from "./utils";
import { COMET_ABI, MAX_FINDINGS } from "./constants";

const addr = createChecksumAddress;
const bn = ethers.BigNumber.from;

export function createAbsorbFinding(
  comet: string,
  absorber: string,
  borrower: string,
  basePaidOut: ethers.BigNumberish,
  chainId: number,
  block: number
): Finding {
  return Finding.from({
    name: "Large borrow position absorption on Comet contract",
    description: "A large borrow position was absorbed in a Comet contract",
    alertId: "COMP2-4-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      block: block.toString(),
      chain: Network[chainId],
      comet,
      absorber,
      borrower,
      basePaidOut: basePaidOut.toString(),
    },
    addresses: [comet, absorber, borrower],
  });
}

export function createLiquidationRiskFinding(
  comet: string,
  borrower: string,
  positionSize: ethers.BigNumberish,
  chainId: number,
  block: number
): Finding {
  return Finding.from({
    name: "Large borrow position not collateralized on Comet contract",
    description: "A large borrow position exceeded the borrowCollateralFactor and is at risk in a Comet contract",
    alertId: "COMP2-4-2",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      block: block.toString(),
      chain: Network[chainId],
      comet,
      borrower,
      positionSize: positionSize.toString(),
    },
    addresses: [comet, borrower],
  });
}

const COMET = [
  {
    address: addr("0x1"),
    deploymentBlock: 0,
    baseLargeThreshold: "1000",
    monitoringListLength: 101,
  },
  {
    address: addr("0x2"),
    deploymentBlock: 0,
    baseLargeThreshold: "10000",
    monitoringListLength: 101,
  },
];
const IRRELEVANT_ADDRESS = addr("0x3");

const MAINNET_MULTICALL_ADDRESS = "0x5ba1e12693dc8f9c48aad8770482f4739beed696";
const MULTICALL_IFACE = new ethers.utils.Interface([
  "function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] memory calls) public returns (tuple(bool success, bytes returnData)[] memory returnData)",
]);
const COMET_IFACE = new ethers.utils.Interface(COMET_ABI);

const NETWORK = Network.MAINNET;

const DEFAULT_CONFIG: AgentConfig = {
  [NETWORK]: {
    cometContracts: COMET,
    alertInterval: 10,
    multicallSize: 10,
    logFetchingBlockRange: 2000,
    logFetchingInterval: 0,
  },
};

interface SupplyInteraction {
  to: string;
  comet: string;
  type: "supply";
  blockTag: number | "latest";
  principalAmount: ethers.BigNumberish;
}

function supply(
  comet: string,
  to: string,
  principalAmount: ethers.BigNumberish,
  blockTag: number | "latest"
): SupplyInteraction {
  return { type: "supply", to, comet, blockTag, principalAmount };
}

interface TransferInteraction {
  from: string;
  comet: string;
  type: "transfer";
  blockTag: number | "latest";
  to: string;
  principalAmount: ethers.BigNumberish;
}

function transfer(
  comet: string,
  from: string,
  to: string,
  principalAmount: ethers.BigNumberish,
  blockTag: number | "latest"
): TransferInteraction {
  return { type: "transfer", from, to, comet, blockTag, principalAmount };
}

interface WithdrawInteraction {
  from: string;
  comet: string;
  type: "withdraw";
  blockTag: number | "latest";
  principalAmount: ethers.BigNumberish;
}

function withdraw(
  comet: string,
  from: string,
  principalAmount: ethers.BigNumberish,
  blockTag: number | "latest"
): WithdrawInteraction {
  return { type: "withdraw", from, comet, blockTag, principalAmount };
}

interface AbsorbInteraction {
  absorber: string;
  comet: string;
  type: "absorb";
  blockTag: number | "latest";
  borrower: string;
}

function absorb(comet: string, absorber: string, borrower: string, blockTag: number | "latest"): AbsorbInteraction {
  return { type: "absorb", absorber, borrower, comet, blockTag };
}

type Interaction = SupplyInteraction | TransferInteraction | WithdrawInteraction | AbsorbInteraction;

describe("Bot Test Suite", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let mockProvider: MockEthersProvider;
  let multicallProvider: MulticallProvider;
  let networkManager: NetworkManager<NetworkData>;
  let initialize: Initialize;
  let handleBlock: HandleBlock;
  let state: AgentState;
  let initialized: boolean;
  let initializationPromise: Promise<void>;
  let userPrincipals: Record<string, Record<string, ethers.BigNumber>>;
  let baseBorrowIndexes: Record<string, Record<number, ethers.BigNumber>>;
  let baseIndexScales: Record<string, Record<number, ethers.BigNumber>>;

  async function block(blockTag: number | "latest") {
    return blockTag === "latest" ? await provider.getBlockNumber() : blockTag;
  }

  function generateMockProviderCall() {
    const _call = mockProvider.call;

    mockProvider.call = jest.fn().mockImplementation(async ({ data, to, from }, blockTag) => {
      try {
        if (blockTag === "latest") {
          return await mockProvider.call({ data, to, from }, await provider.getBlockNumber());
        }

        if (addr(to) !== addr(MAINNET_MULTICALL_ADDRESS)) {
          return await _call({ data, to, from });
        }

        const calls = MULTICALL_IFACE.decodeFunctionData("tryAggregate", data).calls as Array<{
          callData: string;
          target: string;
        }>;

        const results = await Promise.all(
          calls.map((call) => mockProvider.call({ data: call.callData, to: call.target }, blockTag))
        );

        return MULTICALL_IFACE.encodeFunctionResult("tryAggregate", [
          results.map((result) => ({ success: true, returnData: result })),
        ]);
      } catch {
        if (COMET.some((comet) => addr(comet.address) === addr(to))) {
          const tx = COMET_IFACE.parseTransaction({ data });
          throw new Error(
            `Error while trying to call ${tx.name}(${tx.args
              .map((el) => el.toString())
              .join(", ")}) on contract ${to} at block ${blockTag}`
          );
        } else {
          throw new Error(`Error while trying to make the call ${JSON.stringify({ data, to })} at block ${blockTag}`);
        }
      }
    });
  }

  async function processInteractions(interactions: Interaction[]) {
    const latestBlock = await provider.getBlockNumber();

    const block = (tag: number | "latest") => (tag === "latest" ? latestBlock : tag);
    const principal = (comet: string, user: string) => {
      comet = addr(comet);
      if (!userPrincipals[comet]) userPrincipals[comet] = {};
      return userPrincipals[comet][addr(user)] || ethers.constants.Zero;
    };
    const setPrincipal = (comet: string, user: string, value: ethers.BigNumber) =>
      (userPrincipals[addr(comet)][addr(user)] = value);

    [...interactions]
      .sort((a, b) => block(a.blockTag) - block(b.blockTag))
      .forEach((interaction) => {
        const comet = addr(interaction.comet);
        const blockTag = interaction.blockTag;

        const baseBorrowIndex = comet !== IRRELEVANT_ADDRESS ? baseBorrowIndexes[comet][latestBlock] : bn(1);
        const baseIndexScale = comet !== IRRELEVANT_ADDRESS ? baseIndexScales[comet][latestBlock] : bn(1);

        const presentValue = (amount: ethers.BigNumberish) => baseBorrowIndex.mul(amount).div(baseIndexScale);

        switch (interaction.type) {
          case "supply":
            {
              const addr = interaction.to;
              const amount = interaction.principalAmount;

              setPrincipal(comet, addr, principal(comet, addr).add(amount));

              addSupply(comet, addr, presentValue(amount), block(blockTag));
              setUserPrincipal(comet, addr, principal(comet, addr), block(blockTag));
              setUserPrincipal(comet, addr, principal(comet, addr), latestBlock);
            }
            break;
          case "transfer":
            {
              const { from, to, principalAmount } = interaction;

              setPrincipal(comet, from, principal(comet, from).sub(principalAmount));
              setPrincipal(comet, to, principal(comet, to).add(principalAmount));

              addTransfer(comet, from, to, presentValue(principalAmount), block(blockTag));
              setUserPrincipal(comet, from, principal(comet, from), block(blockTag));
              setUserPrincipal(comet, to, principal(comet, to), block(blockTag));
              setUserPrincipal(comet, from, principal(comet, from), latestBlock);
              setUserPrincipal(comet, to, principal(comet, to), latestBlock);
            }
            break;
          case "withdraw":
            {
              const { from, principalAmount } = interaction;

              setPrincipal(comet, from, principal(comet, from).sub(principalAmount));

              addWithdrawal(comet, from, presentValue(principalAmount), block(blockTag));
              setUserPrincipal(comet, from, principal(comet, from), block(blockTag));
              setUserPrincipal(comet, from, principal(comet, from), latestBlock);
            }
            break;
          case "absorb":
            {
              const { borrower, absorber } = interaction;

              const previousPrincipal = principal(comet, borrower);
              if (!previousPrincipal.isNegative()) {
                throw new Error("Cannot absorb positive position");
              }

              setPrincipal(comet, borrower, ethers.constants.Zero);

              addAbsorbDebt(comet, absorber, borrower, presentValue(previousPrincipal).mul(-1), block(blockTag));
              setUserPrincipal(comet, borrower, principal(comet, borrower), block(blockTag));
              setUserPrincipal(comet, absorber, principal(comet, borrower), latestBlock);
            }
            break;
        }
      });
  }

  async function addWithdrawal(comet: string, src: string, amount: ethers.BigNumberish, blockTag: number | "latest") {
    mockProvider.addLogs([
      {
        ...COMET_IFACE.encodeEventLog("Withdraw", [src, ethers.constants.AddressZero, amount]),
        address: comet,
        blockNumber: await block(blockTag),
      } as Log,
    ]);
  }

  async function addSupply(comet: string, dst: string, amount: ethers.BigNumberish, blockTag: number | "latest") {
    mockProvider.addLogs([
      {
        ...COMET_IFACE.encodeEventLog("Supply", [ethers.constants.AddressZero, dst, amount]),
        address: comet,
        blockNumber: await block(blockTag),
      } as Log,
    ]);
  }

  async function addTransfer(
    comet: string,
    from: string,
    to: string,
    amount: ethers.BigNumberish,
    blockTag: number | "latest"
  ) {
    mockProvider.addLogs([
      {
        ...COMET_IFACE.encodeEventLog("Transfer", [from, to, amount]),
        address: comet,
        blockNumber: await block(blockTag),
      } as Log,
    ]);
  }

  async function addAbsorbDebt(
    comet: string,
    absorber: string,
    borrower: string,
    basePaidOut: ethers.BigNumberish,
    blockTag: number | "latest"
  ) {
    basePaidOut = bn(basePaidOut);
    mockProvider.addLogs([
      {
        ...COMET_IFACE.encodeEventLog("AbsorbDebt", [absorber, borrower, basePaidOut, ethers.constants.Zero]),
        address: comet,
        blockNumber: await block(blockTag),
      } as Log,
    ]);
  }

  async function setUserPrincipal(
    comet: string,
    user: string,
    principal: ethers.BigNumberish,
    blockTag: number | "latest"
  ) {
    principal = bn(principal);
    mockProvider.addCallTo(comet, await block(blockTag), COMET_IFACE, "userBasic", {
      inputs: [user],
      outputs: [principal, ethers.constants.Zero, ethers.constants.Zero, 0, 0],
    });
  }

  async function setIsBorrowCollateralized(comet: string, user: string, status: boolean, blockTag: number | "latest") {
    mockProvider.addCallTo(comet, await block(blockTag), COMET_IFACE, "isBorrowCollateralized", {
      inputs: [user],
      outputs: [status],
    });
  }

  async function setBaseIndexScale(comet: string, value: ethers.BigNumberish, blockTag: number | "latest") {
    value = bn(value);
    comet = addr(comet);
    const blockNumber = await block(blockTag);

    mockProvider.addCallTo(comet, blockNumber, COMET_IFACE, "baseIndexScale", {
      inputs: [],
      outputs: [value],
    });

    if (!baseIndexScales[comet]) baseIndexScales[comet] = {};
    baseIndexScales[comet][blockNumber] = value;
  }

  async function setBaseBorrowIndex(comet: string, value: ethers.BigNumberish, blockTag: number | "latest") {
    value = bn(value);
    comet = addr(comet);
    const blockNumber = await block(blockTag);

    mockProvider.addCallTo(comet, blockNumber, COMET_IFACE, "totalsBasic", {
      inputs: [],
      outputs: [
        {
          baseSupplyIndex: ethers.constants.Zero,
          baseBorrowIndex: value,
          trackingSupplyIndex: ethers.constants.Zero,
          trackingBorrowIndex: ethers.constants.Zero,
          totalSupplyBase: ethers.constants.Zero,
          totalBorrowBase: ethers.constants.Zero,
          lastAccrualTime: 0,
          pauseFlags: 0,
        },
      ],
    });

    if (!baseBorrowIndexes[comet]) baseBorrowIndexes[comet] = {};
    baseBorrowIndexes[comet][blockNumber] = value;
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(NETWORK);
    mockProvider.setLatestBlock(10);
    generateMockProviderCall();

    provider = mockProvider as unknown as ethers.providers.JsonRpcProvider;

    multicallProvider = new MulticallProvider(provider, NETWORK);

    userPrincipals = {};
    baseBorrowIndexes = {};
    baseIndexScales = {};

    let initializationResolve: (value: void | PromiseLike<void>) => void;
    initializationPromise = new Promise((res) => (initializationResolve = res));

    initialized = false;
    state = {
      get initialized() {
        return initialized;
      },
      set initialized(value: boolean) {
        initialized = value;
        initializationResolve();
      },
      monitoringLists: {},
      cometContracts: [],
      lastHandledBlock: 0,
      initializationBlock: 0,
      findingBuffer: [],
    };

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    initialize = provideInitialize(state, networkManager, multicallProvider, provider);
    handleBlock = provideHandleBlock(state, networkManager, multicallProvider, provider);
  });

  it("should correctly get the network data", async () => {
    await initialize();
    await initializationPromise;

    expect(networkManager.getNetwork()).toStrictEqual(NETWORK);

    Object.entries(DEFAULT_CONFIG[NETWORK]).forEach(([key, value]) => {
      expect(networkManager.get(key as keyof NetworkData)).toStrictEqual(value);
    });
  });

  it("should correctly set the `initialized` flag", async () => {
    expect(state.initialized).toStrictEqual(false);
    await initialize();
    await initializationPromise;
    expect(state.initialized).toStrictEqual(true);
  });

  it("should correctly instantiate Comet contract objects", async () => {
    await initialize();
    await initializationPromise;

    state.cometContracts.forEach((entry, idx) => {
      expect(addr(entry.comet.address)).toStrictEqual(addr(COMET[idx].address));
      expect(addr(entry.multicallComet.address)).toStrictEqual(addr(COMET[idx].address));
      expect(entry.threshold.eq(COMET[idx].baseLargeThreshold)).toBe(true);
      expect(entry.deploymentBlock).toStrictEqual(COMET[idx].deploymentBlock);
    });
  });

  it("should correctly build a monitoring list based on previous interactions", async () => {
    const interactions: Interaction[] = [
      withdraw(COMET[0].address, addr("0xb0"), 100, 0),
      supply(COMET[0].address, addr("0xb1"), 200, 1),
      transfer(COMET[0].address, addr("0xb2"), addr("0xb3"), 300, 2),
      withdraw(COMET[1].address, addr("0xb4"), 400, "latest"),
      supply(COMET[1].address, addr("0xb4"), 500, "latest"),
      transfer(COMET[1].address, addr("0xb4"), addr("0xb5"), 600, "latest"),
    ];

    await processInteractions(interactions);

    await initialize();
    await initializationPromise;

    expect(state.monitoringLists).toStrictEqual({
      [COMET[0].address]: [
        { alertedAt: 0, borrower: addr("0xb2"), principal: bn(-300) },
        { alertedAt: 0, borrower: addr("0xb0"), principal: bn(-100) },
        { alertedAt: 0, borrower: addr("0xb1"), principal: bn(200) },
        { alertedAt: 0, borrower: addr("0xb3"), principal: bn(300) },
      ],
      [COMET[1].address]: [
        { alertedAt: 0, borrower: addr("0xb4"), principal: bn(-400 + 500 - 600) },
        { alertedAt: 0, borrower: addr("0xb5"), principal: bn(600) },
      ],
    });
  });

  it("should not add users to monitoring lists if previous events were emitted from other contracts", async () => {
    const interactions: Interaction[] = [
      withdraw(IRRELEVANT_ADDRESS, addr("0xb0"), 100, "latest"),
      supply(IRRELEVANT_ADDRESS, addr("0xb1"), 200, "latest"),
      transfer(IRRELEVANT_ADDRESS, addr("0xb2"), addr("0xb3"), 300, "latest"),
      withdraw(IRRELEVANT_ADDRESS, addr("0xb4"), 400, "latest"),
      supply(IRRELEVANT_ADDRESS, addr("0xb4"), 500, "latest"),
      transfer(IRRELEVANT_ADDRESS, addr("0xb4"), addr("0xb5"), 600, "latest"),
    ];

    await processInteractions(interactions);

    await initialize();
    await initializationPromise;

    expect(state.monitoringLists).toStrictEqual({
      [COMET[0].address]: [],
      [COMET[1].address]: [],
    });
  });

  it("should add users to the monitoring list if there's a relevant event from comet contracts on each block", async () => {
    const previousInteractions: Interaction[] = [withdraw(COMET[0].address, addr("0xb0"), 100, 0)];

    await processInteractions(previousInteractions);

    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const interactions = [
      supply(COMET[0].address, addr("0xb1"), 200, "latest"),
      transfer(COMET[0].address, addr("0xb2"), addr("0xb3"), 300, "latest"),
      withdraw(COMET[1].address, addr("0xb4"), 400, "latest"),
      supply(COMET[1].address, addr("0xb4"), 500, "latest"),
      transfer(COMET[1].address, addr("0xb4"), addr("0xb5"), 600, "latest"),
    ];

    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET[0].address]: [
        { alertedAt: 0, borrower: addr("0xb2"), principal: bn(-300) },
        { alertedAt: 0, borrower: addr("0xb0"), principal: bn(-100) },
        { alertedAt: 0, borrower: addr("0xb1"), principal: bn(200) },
        { alertedAt: 0, borrower: addr("0xb3"), principal: bn(300) },
      ],
      [COMET[1].address]: [
        { alertedAt: 0, borrower: addr("0xb4"), principal: bn(-400 + 500 - 600) },
        { alertedAt: 0, borrower: addr("0xb5"), principal: bn(600) },
      ],
    });

    const nextBlockNumber = blockNumber + 1;
    mockProvider.setLatestBlock(nextBlockNumber);
    const nextBlockEvent = new TestBlockEvent().setNumber(nextBlockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const nextInteractions = [
      supply(COMET[1].address, addr("0xb6"), 700, "latest"),
      transfer(COMET[1].address, addr("0xb7"), addr("0xb8"), 800, "latest"),
      withdraw(COMET[0].address, addr("0xb9"), 900, "latest"),
    ];

    await processInteractions(nextInteractions);

    const nextFindings = await handleBlock(nextBlockEvent);

    expect(nextFindings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET[0].address]: [
        { alertedAt: 0, borrower: addr("0xb9"), principal: bn(-900) },
        { alertedAt: 0, borrower: addr("0xb2"), principal: bn(-300) },
        { alertedAt: 0, borrower: addr("0xb0"), principal: bn(-100) },
        { alertedAt: 0, borrower: addr("0xb1"), principal: bn(200) },
        { alertedAt: 0, borrower: addr("0xb3"), principal: bn(300) },
      ],
      [COMET[1].address]: [
        { alertedAt: 0, borrower: addr("0xb7"), principal: bn(-800) },
        { alertedAt: 0, borrower: addr("0xb4"), principal: bn(-400 + 500 - 600) },
        { alertedAt: 0, borrower: addr("0xb5"), principal: bn(600) },
        { alertedAt: 0, borrower: addr("0xb6"), principal: bn(700) },
        { alertedAt: 0, borrower: addr("0xb8"), principal: bn(800) },
      ],
    });
  });

  it("should update existing users principals in the monitoring list if there's a relevant event involving them", async () => {
    const previousInteractions: Interaction[] = [
      withdraw(COMET[0].address, addr("0xb0"), 100, 0),
      supply(COMET[0].address, addr("0xb1"), 200, "latest"),
      transfer(COMET[1].address, addr("0xb2"), addr("0xb3"), 300, "latest"),
    ];

    await processInteractions(previousInteractions);

    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const interactions = [
      supply(COMET[0].address, addr("0xb0"), 100, "latest"),
      withdraw(COMET[0].address, addr("0xb1"), 200, "latest"),
      transfer(COMET[1].address, addr("0xb3"), addr("0xb2"), 300, "latest"),
    ];

    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET[0].address]: [
        { alertedAt: 0, borrower: addr("0xb0"), principal: bn(0) },
        { alertedAt: 0, borrower: addr("0xb1"), principal: bn(0) },
      ],
      [COMET[1].address]: [
        { alertedAt: 0, borrower: addr("0xb2"), principal: bn(0) },
        { alertedAt: 0, borrower: addr("0xb3"), principal: bn(0) },
      ],
    });
  });

  it("should not add users to the monitoring list if there's a relevant event from another contract on each block", async () => {
    const previousInteractions: Interaction[] = [withdraw(COMET[0].address, addr("0xb0"), 100, 0)];

    await processInteractions(previousInteractions);

    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const interactions = [
      supply(IRRELEVANT_ADDRESS, addr("0xb1"), 100, "latest"),
      withdraw(IRRELEVANT_ADDRESS, addr("0xb2"), 200, "latest"),
      transfer(IRRELEVANT_ADDRESS, addr("0xb3"), addr("0xb4"), 300, "latest"),
    ];

    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET[0].address]: [{ alertedAt: 0, borrower: addr("0xb0"), principal: bn(-100) }],
      [COMET[1].address]: [],
    });
  });

  it("should not update users principals on the monitoring list if there's a relevant event from another contract on each block", async () => {
    const previousInteractions: Interaction[] = [withdraw(COMET[0].address, addr("0xb0"), 100, 0)];

    await processInteractions(previousInteractions);

    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const interactions = [
      supply(IRRELEVANT_ADDRESS, addr("0xb0"), 100, "latest"),
      withdraw(IRRELEVANT_ADDRESS, addr("0xb0"), 200, "latest"),
      transfer(IRRELEVANT_ADDRESS, addr("0xb0"), addr("0xb1"), 300, "latest"),
    ];

    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET[0].address]: [{ alertedAt: 0, borrower: addr("0xb0"), principal: bn(-100) }],
      [COMET[1].address]: [],
    });
  });

  it("should not emit a finding if there's a debt absorption that is not large", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const basePaidOuts = COMET.map((comet) => bn(comet.baseLargeThreshold).sub(1));

    const interactions = [
      withdraw(COMET[0].address, addr("0xb0"), basePaidOuts[0], "latest"),
      absorb(COMET[0].address, addr("0xa0"), addr("0xb0"), "latest"),
      withdraw(COMET[1].address, addr("0xb0"), basePaidOuts[1], "latest"),
      absorb(COMET[1].address, addr("0xa0"), addr("0xb0"), "latest"),
    ];

    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should emit a finding if there's a debt absorption that is large", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const basePaidOuts = COMET.map((comet) => bn(comet.baseLargeThreshold));

    const interactions = [
      withdraw(COMET[0].address, addr("0xb0"), basePaidOuts[0], "latest"),
      absorb(COMET[0].address, addr("0xa0"), addr("0xb0"), "latest"),
      withdraw(COMET[1].address, addr("0xb0"), basePaidOuts[1], "latest"),
      absorb(COMET[1].address, addr("0xa0"), addr("0xb0"), "latest"),
      withdraw(COMET[0].address, addr("0xb1"), basePaidOuts[0].add(1), "latest"),
      absorb(COMET[0].address, addr("0xa1"), addr("0xb1"), "latest"),
      withdraw(COMET[1].address, addr("0xb2"), basePaidOuts[1].add(1), "latest"),
      absorb(COMET[1].address, addr("0xa2"), addr("0xb2"), "latest"),
    ];

    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);
    expect(findings.sort()).toStrictEqual(
      [
        createAbsorbFinding(COMET[0].address, addr("0xa0"), addr("0xb0"), basePaidOuts[0], NETWORK, blockNumber),
        createAbsorbFinding(COMET[1].address, addr("0xa0"), addr("0xb0"), basePaidOuts[1], NETWORK, blockNumber),
        createAbsorbFinding(COMET[0].address, addr("0xa1"), addr("0xb1"), basePaidOuts[0].add(1), NETWORK, blockNumber),
        createAbsorbFinding(COMET[1].address, addr("0xa2"), addr("0xb2"), basePaidOuts[1].add(1), NETWORK, blockNumber),
      ].sort()
    );
  });

  it("should only check status of large borrows", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const largeAmounts = COMET.map((comet) => bn(comet.baseLargeThreshold));

    const interactions = [
      withdraw(COMET[0].address, addr("0xb0"), largeAmounts[0].sub(1), "latest"),
      withdraw(COMET[1].address, addr("0xb1"), largeAmounts[1].sub(1), "latest"),
      withdraw(COMET[0].address, addr("0xb2"), largeAmounts[0], "latest"),
      withdraw(COMET[1].address, addr("0xb3"), largeAmounts[1], "latest"),
    ];

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), true, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), true, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), true, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");

    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    const isBorrowCollateralized = (comet: string, borrower: string) => [
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrower]),
        to: comet,
      },
      blockNumber,
    ];

    expect(mockProvider.call).not.toHaveBeenCalledWith(...isBorrowCollateralized(COMET[0].address, addr("0xb0")));
    expect(mockProvider.call).not.toHaveBeenCalledWith(...isBorrowCollateralized(COMET[1].address, addr("0xb1")));
    expect(mockProvider.call).toHaveBeenCalledWith(...isBorrowCollateralized(COMET[0].address, addr("0xb2")));
    expect(mockProvider.call).toHaveBeenCalledWith(...isBorrowCollateralized(COMET[1].address, addr("0xb3")));
  });

  it("should only check status of positions that have not been alerted recently", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(10);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const largeAmounts = COMET.map((comet) => bn(comet.baseLargeThreshold));

    const interactions = [
      withdraw(COMET[0].address, addr("0xb0"), largeAmounts[0], "latest"),
      withdraw(COMET[1].address, addr("0xb1"), largeAmounts[1], "latest"),
      withdraw(COMET[0].address, addr("0xb2"), largeAmounts[0], "latest"),
      withdraw(COMET[1].address, addr("0xb3"), largeAmounts[1], "latest"),
    ];

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), true, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");
    await processInteractions(interactions);

    await handleBlock(blockEvent);

    const nextBlockNumber = blockNumber + 1;
    mockProvider.setLatestBlock(nextBlockNumber);
    const nextBlockEvent = new TestBlockEvent()
      .setNumber(nextBlockNumber)
      .setTimestamp(10 + DEFAULT_CONFIG[NETWORK].alertInterval - 1);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), true, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");

    const isBorrowCollateralized = (comet: string, borrower: string) => [
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrower]),
        to: comet,
      },
      nextBlockNumber,
    ];

    await handleBlock(nextBlockEvent);

    expect(mockProvider.call).not.toHaveBeenCalledWith(...isBorrowCollateralized(COMET[0].address, addr("0xb0")));
    expect(mockProvider.call).not.toHaveBeenCalledWith(...isBorrowCollateralized(COMET[1].address, addr("0xb1")));
    expect(mockProvider.call).toHaveBeenCalledWith(...isBorrowCollateralized(COMET[0].address, addr("0xb2")));
    expect(mockProvider.call).toHaveBeenCalledWith(...isBorrowCollateralized(COMET[1].address, addr("0xb3")));
  });

  it("should only check status of positions that have not been alerted recently", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(10);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    const largeAmounts = COMET.map((comet) => bn(comet.baseLargeThreshold));

    const interactions = [
      withdraw(COMET[0].address, addr("0xb0"), largeAmounts[0], "latest"),
      withdraw(COMET[1].address, addr("0xb1"), largeAmounts[1], "latest"),
      withdraw(COMET[0].address, addr("0xb2"), largeAmounts[0], "latest"),
      withdraw(COMET[1].address, addr("0xb3"), largeAmounts[1], "latest"),
    ];

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), true, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");
    await processInteractions(interactions);

    await handleBlock(blockEvent);

    const nextBlockNumber = blockNumber + 1;
    mockProvider.setLatestBlock(nextBlockNumber);
    const nextBlockEvent = new TestBlockEvent()
      .setNumber(nextBlockNumber)
      .setTimestamp(10 + DEFAULT_CONFIG[NETWORK].alertInterval - 1);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, 1, "latest");
        await setBaseIndexScale(comet.address, 1, "latest");
      })
    );

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), true, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");

    const isBorrowCollateralized = (comet: string, borrower: string) => [
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrower]),
        to: comet,
      },
      nextBlockNumber,
    ];

    await handleBlock(nextBlockEvent);

    expect(mockProvider.call).not.toHaveBeenCalledWith(...isBorrowCollateralized(COMET[0].address, addr("0xb0")));
    expect(mockProvider.call).not.toHaveBeenCalledWith(...isBorrowCollateralized(COMET[1].address, addr("0xb1")));
    expect(mockProvider.call).toHaveBeenCalledWith(...isBorrowCollateralized(COMET[0].address, addr("0xb2")));
    expect(mockProvider.call).toHaveBeenCalledWith(...isBorrowCollateralized(COMET[1].address, addr("0xb3")));
  });

  it("should emit a finding for each large borrower whose borrow is not collateralized if it's not under cooldown", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(10);

    const baseBorrowIndexes = { [COMET[0].address]: bn(10), [COMET[1].address]: bn(20) };
    const baseIndexScales = { [COMET[0].address]: bn(2), [COMET[1].address]: bn(3) };
    const principalValue = (comet: string, amount: ethers.BigNumberish) =>
      baseIndexScales[comet].mul(amount).div(baseBorrowIndexes[comet]);
    const presentValue = (comet: string, amount: ethers.BigNumberish) =>
      baseBorrowIndexes[comet].mul(amount).div(baseIndexScales[comet]);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, baseBorrowIndexes[comet.address], "latest");
        await setBaseIndexScale(comet.address, baseIndexScales[comet.address], "latest");
      })
    );

    const largePrincipals = COMET.map((comet) => principalValue(comet.address, comet.baseLargeThreshold));

    const interactions = [
      withdraw(COMET[0].address, addr("0xb0"), largePrincipals[0], "latest"),
      withdraw(COMET[1].address, addr("0xb1"), largePrincipals[1], "latest"),
      withdraw(COMET[0].address, addr("0xb2"), largePrincipals[0], "latest"),
      withdraw(COMET[1].address, addr("0xb3"), largePrincipals[1], "latest"),
      withdraw(COMET[0].address, addr("0xb4"), largePrincipals[0].sub(1), "latest"),
      withdraw(COMET[0].address, addr("0xb5"), largePrincipals[0].add(1), "latest"),
      supply(COMET[0].address, addr("0xb6"), largePrincipals[0], "latest"),
    ];

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), true, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb4"), true, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb5"), true, "latest");
    await processInteractions(interactions);

    const findings = await handleBlock(blockEvent);

    expect(findings.sort()).toStrictEqual(
      [
        createLiquidationRiskFinding(
          COMET[0].address,
          addr("0xb0"),
          presentValue(COMET[0].address, largePrincipals[0]),
          NETWORK,
          blockNumber
        ),
        createLiquidationRiskFinding(
          COMET[1].address,
          addr("0xb1"),
          presentValue(COMET[1].address, largePrincipals[1]),
          NETWORK,
          blockNumber
        ),
      ].sort()
    );

    const nextBlockNumber = blockNumber + 1;
    mockProvider.setLatestBlock(nextBlockNumber);
    const nextBlockEvent = new TestBlockEvent()
      .setNumber(nextBlockNumber)
      .setTimestamp(10 + DEFAULT_CONFIG[NETWORK].alertInterval - 1);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, baseBorrowIndexes[comet.address], "latest");
        await setBaseIndexScale(comet.address, baseIndexScales[comet.address], "latest");
      })
    );

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb4"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb5"), false, "latest");

    const nextFindings = await handleBlock(nextBlockEvent);
    expect(nextFindings.sort()).toStrictEqual(
      [
        createLiquidationRiskFinding(
          COMET[0].address,
          addr("0xb2"),
          presentValue(COMET[0].address, largePrincipals[0]),
          NETWORK,
          nextBlockNumber
        ),
        createLiquidationRiskFinding(
          COMET[0].address,
          addr("0xb5"),
          presentValue(COMET[0].address, largePrincipals[0].add(1)),
          NETWORK,
          nextBlockNumber
        ),
      ].sort()
    );

    const finalBlockNumber = blockNumber + 1;
    mockProvider.setLatestBlock(finalBlockNumber);
    const finalBlockEvent = new TestBlockEvent()
      .setNumber(finalBlockNumber)
      .setTimestamp(10 + DEFAULT_CONFIG[NETWORK].alertInterval);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, baseBorrowIndexes[comet.address], "latest");
        await setBaseIndexScale(comet.address, baseIndexScales[comet.address], "latest");
      })
    );

    await setIsBorrowCollateralized(COMET[0].address, addr("0xb0"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb1"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb2"), false, "latest");
    await setIsBorrowCollateralized(COMET[1].address, addr("0xb3"), true, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb4"), false, "latest");
    await setIsBorrowCollateralized(COMET[0].address, addr("0xb5"), false, "latest");

    const finalFindings = await handleBlock(finalBlockEvent);
    expect(finalFindings.sort()).toStrictEqual(
      [
        createLiquidationRiskFinding(
          COMET[0].address,
          addr("0xb0"),
          presentValue(COMET[0].address, largePrincipals[0]),
          NETWORK,
          finalBlockNumber
        ),
        createLiquidationRiskFinding(
          COMET[1].address,
          addr("0xb1"),
          presentValue(COMET[1].address, largePrincipals[1]),
          NETWORK,
          finalBlockNumber
        ),
      ].sort()
    );
  });

  it("should buffer findings and send them in future blocks if necessary", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = (await provider.getBlockNumber()) + 1;
    mockProvider.setLatestBlock(blockNumber);
    const blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(10);

    const baseBorrowIndexes = { [COMET[0].address]: bn(10), [COMET[1].address]: bn(20) };
    const baseIndexScales = { [COMET[0].address]: bn(2), [COMET[1].address]: bn(3) };
    const principalValue = (comet: string, amount: ethers.BigNumberish) =>
      baseIndexScales[comet].mul(amount).div(baseBorrowIndexes[comet]);
    const presentValue = (comet: string, amount: ethers.BigNumberish) =>
      baseBorrowIndexes[comet].mul(amount).div(baseIndexScales[comet]);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, baseBorrowIndexes[comet.address], "latest");
        await setBaseIndexScale(comet.address, baseIndexScales[comet.address], "latest");
      })
    );

    const largePrincipals = COMET.map((comet) => principalValue(comet.address, comet.baseLargeThreshold));
    const users = new Array({ length: MAX_FINDINGS + 1 }).map((_, idx) => addr(`0xb${idx}`));

    const interactions = users.map((user, idx) =>
      withdraw(COMET[idx & 1].address, user, largePrincipals[idx & 1], "latest")
    );

    await Promise.all(
      users.map(async (user, idx) => {
        await setIsBorrowCollateralized(COMET[idx & 1].address, user, false, "latest");
      })
    );
    await processInteractions(interactions);

    const expectedFindings = users.map((user, idx) =>
      createLiquidationRiskFinding(
        COMET[idx & 1].address,
        user,
        presentValue(COMET[idx & 1].address, largePrincipals[idx & 1]),
        NETWORK,
        blockNumber
      )
    );

    const findings = await handleBlock(blockEvent);

    expect(findings.sort()).toStrictEqual([...expectedFindings.slice(0, MAX_FINDINGS)].sort());

    const nextBlockNumber = blockNumber + 1;
    mockProvider.setLatestBlock(nextBlockNumber);
    const nextBlockEvent = new TestBlockEvent()
      .setNumber(nextBlockNumber)
      .setTimestamp(10 + DEFAULT_CONFIG[NETWORK].alertInterval);

    await Promise.all(
      COMET.map(async (comet) => {
        await setBaseBorrowIndex(comet.address, baseBorrowIndexes[comet.address], "latest");
        await setBaseIndexScale(comet.address, baseIndexScales[comet.address], "latest");
      })
    );

    await Promise.all(
      users.map(async (user, idx) => {
        await setIsBorrowCollateralized(COMET[idx & 1].address, user, true, "latest");
      })
    );
    await setIsBorrowCollateralized(COMET[0].address, users[0], false, "latest");

    const nextFindings = await handleBlock(nextBlockEvent);
    expect(nextFindings.sort()).toStrictEqual(
      [
        ...expectedFindings.slice(MAX_FINDINGS),
        createLiquidationRiskFinding(
          COMET[0].address,
          users[0],
          presentValue(COMET[0].address, largePrincipals[0]),
          NETWORK,
          nextBlockNumber
        ),
      ].sort()
    );
  });
});
