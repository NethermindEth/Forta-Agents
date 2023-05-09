import { ethers, Finding, FindingSeverity, FindingType, HandleBlock, Initialize, Network } from "forta-agent";
import { createChecksumAddress, MulticallProvider, NetworkManager } from "forta-agent-tools";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { Log } from "@ethersproject/abstract-provider";

import { provideInitialize, provideHandleBlock } from "./agent";
import { AgentConfig, AgentState, NetworkData } from "./utils";
import { COMET_ABI } from "./constants";

export function createAbsorbFinding(
  comet: string,
  absorber: string,
  borrower: string,
  basePaidOut: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Large borrow position absorption on Comet contract",
    description: "A large borrow position was absorbed in a Comet contract",
    alertId: "COMP2-4-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
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
  chainId: number
): Finding {
  return Finding.from({
    name: "Large borrow position not collateralized on Comet contract",
    description: "A large borrow position exceeded the borrowCollateralFactor and is at risk in a Comet contract",
    alertId: "COMP2-4-2",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      chain: Network[chainId],
      comet,
      borrower,
      positionSize: positionSize.toString(),
    },
    addresses: [comet, borrower],
  });
}

const COMET_CONTRACTS = [
  {
    address: createChecksumAddress("0x1"),
    deploymentBlock: 0,
    baseLargeThreshold: "100",
    monitoringListLength: 101,
  },
  {
    address: createChecksumAddress("0x2"),
    deploymentBlock: 0,
    baseLargeThreshold: "1000",
    monitoringListLength: 101,
  },
];
const IRRELEVANT_ADDRESS = createChecksumAddress("0x3");

const MAINNET_MULTICALL_ADDRESS = "0x5ba1e12693dc8f9c48aad8770482f4739beed696";
const MULTICALL_IFACE = new ethers.utils.Interface([
  "function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] memory calls) public returns (tuple(bool success, bytes returnData)[] memory returnData)",
]);
const COMET_IFACE = new ethers.utils.Interface(COMET_ABI);

const network = Network.MAINNET;

const DEFAULT_CONFIG: AgentConfig = {
  [network]: {
    cometContracts: COMET_CONTRACTS,
    alertInterval: 10,
    multicallSize: 10,
    logFetchingBlockRange: 2000,
    logFetchingInterval: 0,
  },
};

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

  function generateMockProviderCall() {
    const _call = mockProvider.call;

    mockProvider.call = jest.fn().mockImplementation(async ({ data, to, from }, blockTag) => {
      if (to.toLowerCase() === MAINNET_MULTICALL_ADDRESS) {
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
      } else {
        return _call({ data, to, from });
      }
    });
  }

  function addWithdrawal(comet: string, src: string, block: number | string) {
    mockProvider.addLogs([
      {
        ...COMET_IFACE.encodeEventLog("Withdraw", [src, ethers.constants.AddressZero, ethers.constants.Zero]),
        address: comet,
        blockNumber: block,
      } as Log,
    ]);
  }

  function addSupply(comet: string, dst: string, block: number | string) {
    mockProvider.addLogs([
      {
        ...COMET_IFACE.encodeEventLog("Supply", [ethers.constants.AddressZero, dst, ethers.constants.Zero]),
        address: comet,
        blockNumber: block,
      } as Log,
    ]);
  }

  function addAbsorbDebt(
    comet: string,
    absorber: string,
    borrower: string,
    basePaidOut: ethers.BigNumberish,
    block: number | string
  ) {
    basePaidOut = ethers.BigNumber.from(basePaidOut);
    mockProvider.addLogs([
      {
        ...COMET_IFACE.encodeEventLog("AbsorbDebt", [absorber, borrower, basePaidOut, ethers.constants.Zero]),
        address: comet,
        blockNumber: block,
      } as Log,
    ]);
  }

  function setUserPrincipal(comet: string, user: string, principal: ethers.BigNumberish, block: number | string) {
    principal = ethers.BigNumber.from(principal);
    mockProvider.addCallTo(comet, block, COMET_IFACE, "userBasic", {
      inputs: [user],
      outputs: [principal, ethers.constants.Zero, ethers.constants.Zero, 0, 0],
    });
  }

  function setIsBorrowCollateralized(comet: string, user: string, status: boolean, block: number | string) {
    mockProvider.addCallTo(comet, block, COMET_IFACE, "isBorrowCollateralized", {
      inputs: [user],
      outputs: [status],
    });
  }

  function setBaseIndexScale(comet: string, value: ethers.BigNumberish, block: number | string) {
    value = ethers.BigNumber.from(value);
    mockProvider.addCallTo(comet, block, COMET_IFACE, "baseIndexScale", {
      inputs: [],
      outputs: [value],
    });
  }

  function setBaseBorrowIndex(comet: string, value: ethers.BigNumberish, block: number | string) {
    value = ethers.BigNumber.from(value);
    mockProvider.addCallTo(comet, block, COMET_IFACE, "totalsBasic", {
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
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(network);
    mockProvider.setLatestBlock(10);
    generateMockProviderCall();

    provider = mockProvider as unknown as ethers.providers.JsonRpcProvider;

    multicallProvider = new MulticallProvider(provider, network);

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
      lastHandledBlock: 0,
    };

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, "latest");
      setBaseIndexScale(comet.address, 1, "latest");
    });

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    initialize = provideInitialize(state, networkManager, multicallProvider, provider);
    handleBlock = provideHandleBlock(state, networkManager, multicallProvider, provider);
  });

  it("should correctly get the network data", async () => {
    await initialize();
    await initializationPromise;

    expect(networkManager.getNetwork()).toStrictEqual(network);

    Object.entries(DEFAULT_CONFIG[network]).forEach(([key, value]) => {
      expect(networkManager.get(key as keyof NetworkData)).toStrictEqual(value);
    });
  });

  it("should correctly set the `initialized` flag", async () => {
    expect(state.initialized).toStrictEqual(false);
    await initialize();
    await initializationPromise;
    expect(state.initialized).toStrictEqual(true);
  });

  it("should correctly build a monitoring list based on previous borrowers", async () => {
    const previousBorrowers = [
      { address: createChecksumAddress("0xb01"), principal: -1 },
      { address: createChecksumAddress("0xb02"), principal: -2 },
      { address: createChecksumAddress("0xb03"), principal: -3 },
      { address: createChecksumAddress("0xb04"), principal: -4 },
    ];

    COMET_CONTRACTS.forEach((comet) => {
      addWithdrawal(comet.address, previousBorrowers[0].address, comet.deploymentBlock);
      setUserPrincipal(comet.address, previousBorrowers[0].address, previousBorrowers[0].principal, "latest");

      addSupply(comet.address, previousBorrowers[1].address, comet.deploymentBlock + 1);
      setUserPrincipal(comet.address, previousBorrowers[1].address, previousBorrowers[1].principal, "latest");

      addAbsorbDebt(
        comet.address,
        ethers.constants.AddressZero,
        previousBorrowers[2].address,
        0,
        comet.deploymentBlock + 2
      );
      setUserPrincipal(comet.address, previousBorrowers[2].address, previousBorrowers[2].principal, "latest");

      addSupply(comet.address, previousBorrowers[3].address, comet.deploymentBlock);
      addAbsorbDebt(
        comet.address,
        ethers.constants.AddressZero,
        previousBorrowers[3].address,
        0,
        comet.deploymentBlock + 1
      );
      addWithdrawal(comet.address, previousBorrowers[3].address, comet.deploymentBlock + 2);
      setUserPrincipal(comet.address, previousBorrowers[3].address, previousBorrowers[3].principal, "latest");
    });

    await initialize();
    await initializationPromise;

    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: previousBorrowers
        .sort((a, b) => a.principal - b.principal)
        .map((borrower) => ({
          borrower: borrower.address,
          principal: ethers.BigNumber.from(borrower.principal),
          alertedAt: 0,
        })),
      [COMET_CONTRACTS[1].address]: previousBorrowers
        .sort((a, b) => a.principal - b.principal)
        .map((borrower) => ({
          borrower: borrower.address,
          principal: ethers.BigNumber.from(borrower.principal),
          alertedAt: 0,
        })),
    });
  });

  it("should not add users to monitoring lists if relevant events were emitted from other contracts", async () => {
    const previousBorrowers = [
      { address: createChecksumAddress("0xb01"), principal: -1 },
      { address: createChecksumAddress("0xb02"), principal: -2 },
      { address: createChecksumAddress("0xb03"), principal: -3 },
      { address: createChecksumAddress("0xb04"), principal: -4 },
    ];

    COMET_CONTRACTS.forEach((comet) => {
      previousBorrowers.forEach((borrower) => {
        addWithdrawal(IRRELEVANT_ADDRESS, borrower.address, comet.deploymentBlock);
        addSupply(IRRELEVANT_ADDRESS, borrower.address, comet.deploymentBlock);
        addAbsorbDebt(IRRELEVANT_ADDRESS, ethers.constants.AddressZero, borrower.address, 0, comet.deploymentBlock);
        setUserPrincipal(IRRELEVANT_ADDRESS, borrower.address, borrower.principal, "latest");
      });
    });

    await initialize();
    await initializationPromise;

    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [],
      [COMET_CONTRACTS[1].address]: [],
    });

    const currentBorrowers = [
      { address: createChecksumAddress("0xb05"), principal: -5 },
      { address: createChecksumAddress("0xb06"), principal: -6 },
      { address: createChecksumAddress("0xb07"), principal: -7 },
    ];

    const blockNumber = 11;
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, blockNumber);
      setBaseIndexScale(comet.address, 1, blockNumber);
    });

    addWithdrawal(IRRELEVANT_ADDRESS, currentBorrowers[0].address, blockNumber);
    setUserPrincipal(IRRELEVANT_ADDRESS, currentBorrowers[0].address, currentBorrowers[0].principal, blockNumber);
    addSupply(IRRELEVANT_ADDRESS, currentBorrowers[1].address, blockNumber);
    setUserPrincipal(IRRELEVANT_ADDRESS, currentBorrowers[1].address, currentBorrowers[1].principal, blockNumber);
    addAbsorbDebt(
      IRRELEVANT_ADDRESS,
      ethers.constants.AddressZero,
      currentBorrowers[2].address,
      -currentBorrowers[2].principal,
      blockNumber
    );
    setUserPrincipal(IRRELEVANT_ADDRESS, currentBorrowers[2].address, 0, blockNumber);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [],
      [COMET_CONTRACTS[1].address]: [],
    });
  });

  it("should add users to the monitoring list if there's a relevant event from comet contracts on each block", async () => {
    const previousBorrowers = [{ address: createChecksumAddress("0xb01"), principal: -1 }];

    COMET_CONTRACTS.forEach((comet) => {
      previousBorrowers.forEach((borrower, idx) => {
        addWithdrawal(comet.address, borrower.address, idx);
        setUserPrincipal(comet.address, borrower.address, borrower.principal, "latest");
      });
    });

    await initialize();
    await initializationPromise;

    const currentBorrowers = [
      { address: createChecksumAddress("0xb03"), principal: -3, comet: COMET_CONTRACTS[0].address },
      { address: createChecksumAddress("0xb04"), principal: -4, comet: COMET_CONTRACTS[1].address },
      { address: createChecksumAddress("0xb05"), principal: -5, comet: COMET_CONTRACTS[0].address },
    ];

    const blockNumber = 11;
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, blockNumber);
      setBaseIndexScale(comet.address, 1, blockNumber);
    });

    addWithdrawal(currentBorrowers[0].comet, currentBorrowers[0].address, blockNumber);
    setUserPrincipal(
      currentBorrowers[0].comet,
      currentBorrowers[0].address,
      currentBorrowers[0].principal,
      blockNumber
    );
    addSupply(currentBorrowers[1].comet, currentBorrowers[1].address, blockNumber);
    setUserPrincipal(
      currentBorrowers[1].comet,
      currentBorrowers[1].address,
      currentBorrowers[1].principal,
      blockNumber
    );
    addAbsorbDebt(
      currentBorrowers[2].comet,
      ethers.constants.AddressZero,
      currentBorrowers[2].address,
      -currentBorrowers[2].principal,
      blockNumber
    );
    setUserPrincipal(currentBorrowers[2].comet, currentBorrowers[2].address, 0, blockNumber);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [
        {
          borrower: currentBorrowers[0].address,
          principal: ethers.BigNumber.from(currentBorrowers[0].principal),
          alertedAt: 0,
        },
        {
          borrower: previousBorrowers[0].address,
          principal: ethers.BigNumber.from(previousBorrowers[0].principal),
          alertedAt: 0,
        },
        { borrower: currentBorrowers[2].address, principal: ethers.BigNumber.from(0), alertedAt: 0 },
      ],
      [COMET_CONTRACTS[1].address]: [
        {
          borrower: currentBorrowers[1].address,
          principal: ethers.BigNumber.from(currentBorrowers[1].principal),
          alertedAt: 0,
        },
        {
          borrower: previousBorrowers[0].address,
          principal: ethers.BigNumber.from(previousBorrowers[0].principal),
          alertedAt: 0,
        },
      ],
    });

    const nextBorrowers = [
      { address: createChecksumAddress("0xb06"), principal: -6, comet: COMET_CONTRACTS[0].address },
    ];

    const nextBlockNumber = 12;
    const nextBlockEvent = new TestBlockEvent().setNumber(nextBlockNumber);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, nextBlockNumber);
      setBaseIndexScale(comet.address, 1, nextBlockNumber);
    });

    addWithdrawal(nextBorrowers[0].comet, nextBorrowers[0].address, nextBlockNumber);
    setUserPrincipal(nextBorrowers[0].comet, nextBorrowers[0].address, nextBorrowers[0].principal, nextBlockNumber);

    const nextFindings = await handleBlock(nextBlockEvent);

    expect(nextFindings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [
        {
          borrower: nextBorrowers[0].address,
          principal: ethers.BigNumber.from(nextBorrowers[0].principal),
          alertedAt: 0,
        },
        {
          borrower: currentBorrowers[0].address,
          principal: ethers.BigNumber.from(currentBorrowers[0].principal),
          alertedAt: 0,
        },
        {
          borrower: previousBorrowers[0].address,
          principal: ethers.BigNumber.from(previousBorrowers[0].principal),
          alertedAt: 0,
        },
        { borrower: currentBorrowers[2].address, principal: ethers.BigNumber.from(0), alertedAt: 0 },
      ],
      [COMET_CONTRACTS[1].address]: [
        {
          borrower: currentBorrowers[1].address,
          principal: ethers.BigNumber.from(currentBorrowers[1].principal),
          alertedAt: 0,
        },
        {
          borrower: previousBorrowers[0].address,
          principal: ethers.BigNumber.from(previousBorrowers[0].principal),
          alertedAt: 0,
        },
      ],
    });
  });

  it("should update existing users principals in the monitoring list if there's a relevant event involving them", async () => {
    const previousBorrowers = [
      { address: createChecksumAddress("0xb01"), principal: -1 },
      { address: createChecksumAddress("0xb02"), principal: -2 },
    ];

    COMET_CONTRACTS.forEach((comet) => {
      previousBorrowers.forEach((borrower, idx) => {
        addWithdrawal(comet.address, borrower.address, idx);
        setUserPrincipal(comet.address, borrower.address, borrower.principal, "latest");
      });
    });

    await initialize();
    await initializationPromise;

    const currentBorrowers = [
      { address: previousBorrowers[0].address, principal: -3, comet: COMET_CONTRACTS[0].address },
      { address: previousBorrowers[1].address, principal: 3, comet: COMET_CONTRACTS[0].address },
      { address: previousBorrowers[0].address, principal: -4, comet: COMET_CONTRACTS[1].address },
      { address: previousBorrowers[1].address, principal: 0, comet: COMET_CONTRACTS[1].address },
    ];

    const blockNumber = 11;
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, blockNumber);
      setBaseIndexScale(comet.address, 1, blockNumber);
    });

    addWithdrawal(currentBorrowers[0].comet, currentBorrowers[0].address, blockNumber);
    setUserPrincipal(
      currentBorrowers[0].comet,
      currentBorrowers[0].address,
      currentBorrowers[0].principal,
      blockNumber
    );

    addSupply(currentBorrowers[1].comet, currentBorrowers[1].address, blockNumber);
    setUserPrincipal(
      currentBorrowers[1].comet,
      currentBorrowers[1].address,
      currentBorrowers[1].principal,
      blockNumber
    );

    addWithdrawal(currentBorrowers[2].comet, currentBorrowers[2].address, blockNumber);
    setUserPrincipal(
      currentBorrowers[2].comet,
      currentBorrowers[2].address,
      currentBorrowers[2].principal,
      blockNumber
    );

    addAbsorbDebt(
      currentBorrowers[3].comet,
      ethers.constants.AddressZero,
      currentBorrowers[3].address,
      -previousBorrowers[1].principal,
      blockNumber
    );
    setUserPrincipal(currentBorrowers[3].comet, currentBorrowers[3].address, 0, blockNumber);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [
        {
          borrower: currentBorrowers[0].address,
          principal: ethers.BigNumber.from(currentBorrowers[0].principal),
          alertedAt: 0,
        },
        {
          borrower: currentBorrowers[1].address,
          principal: ethers.BigNumber.from(currentBorrowers[1].principal),
          alertedAt: 0,
        },
      ],
      [COMET_CONTRACTS[1].address]: [
        {
          borrower: currentBorrowers[2].address,
          principal: ethers.BigNumber.from(currentBorrowers[2].principal),
          alertedAt: 0,
        },
        {
          borrower: currentBorrowers[3].address,
          principal: ethers.BigNumber.from(currentBorrowers[3].principal),
          alertedAt: 0,
        },
      ],
    });
  });

  it("should not emit a finding if there's a debt absorption is not large", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = 11;
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, blockNumber);
      setBaseIndexScale(comet.address, 1, blockNumber);
    });

    const borrower = createChecksumAddress("0xb01");
    const basePaidOuts = COMET_CONTRACTS.map((comet) => ethers.BigNumber.from(comet.baseLargeThreshold).sub(1));

    COMET_CONTRACTS.forEach((comet, idx) => {
      addAbsorbDebt(comet.address, ethers.constants.AddressZero, borrower, basePaidOuts[idx], blockNumber);
      setUserPrincipal(comet.address, borrower, 0, blockNumber);
    });

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should emit a finding if there's a large debt absorption", async () => {
    await initialize();
    await initializationPromise;

    const blockNumber = 11;
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, blockNumber);
      setBaseIndexScale(comet.address, 1, blockNumber);
    });

    const borrower = createChecksumAddress("0xb01");
    const absorber = createChecksumAddress("0xa01");
    const basePaidOuts = COMET_CONTRACTS.map((comet) => comet.baseLargeThreshold);

    COMET_CONTRACTS.forEach((comet, idx) => {
      addAbsorbDebt(comet.address, absorber, borrower, basePaidOuts[idx], blockNumber);
      setUserPrincipal(comet.address, borrower, 0, blockNumber);
    });

    const findings = await handleBlock(blockEvent);
    expect(findings.sort()).toStrictEqual(
      [
        createAbsorbFinding(COMET_CONTRACTS[0].address, absorber, borrower, basePaidOuts[0], network),
        createAbsorbFinding(COMET_CONTRACTS[1].address, absorber, borrower, basePaidOuts[1], network),
      ].sort()
    );
  });

  it("should only check status of large borrows", async () => {
    const borrowers = [
      { address: createChecksumAddress("0xb01"), principal: 1 },
      { address: createChecksumAddress("0xb02"), principal: -2 },
      { address: createChecksumAddress("0xb03"), principal: `-${COMET_CONTRACTS[0].baseLargeThreshold}` },
      { address: createChecksumAddress("0xb04"), principal: `-${COMET_CONTRACTS[1].baseLargeThreshold}` },
    ];

    expect(ethers.BigNumber.from(COMET_CONTRACTS[1].baseLargeThreshold).gt(COMET_CONTRACTS[0].baseLargeThreshold)).toBe(
      true
    );

    COMET_CONTRACTS.forEach((comet) => {
      borrowers.forEach((borrower, idx) => {
        addWithdrawal(comet.address, borrower.address, idx);
        setUserPrincipal(comet.address, borrower.address, borrower.principal, "latest");
      });
    });

    await initialize();
    await initializationPromise;

    const blockNumber = 11;
    const blockEvent = new TestBlockEvent().setNumber(blockNumber);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, 1, blockNumber);
      setBaseIndexScale(comet.address, 1, blockNumber);
      setIsBorrowCollateralized(comet.address, borrowers[0].address, true, blockNumber);
      setIsBorrowCollateralized(comet.address, borrowers[1].address, false, blockNumber);
      setIsBorrowCollateralized(comet.address, borrowers[2].address, false, blockNumber);
      setIsBorrowCollateralized(comet.address, borrowers[3].address, true, blockNumber);
    });

    await handleBlock(blockEvent);

    expect(mockProvider.call).not.toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[0].address]),
        to: COMET_CONTRACTS[0].address,
      },
      blockNumber
    );
    expect(mockProvider.call).not.toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[1].address]),
        to: COMET_CONTRACTS[0].address,
      },
      blockNumber
    );
    expect(mockProvider.call).toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[2].address]),
        to: COMET_CONTRACTS[0].address,
      },
      blockNumber
    );
    expect(mockProvider.call).toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[3].address]),
        to: COMET_CONTRACTS[0].address,
      },
      blockNumber
    );

    expect(mockProvider.call).not.toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[0].address]),
        to: COMET_CONTRACTS[1].address,
      },
      blockNumber
    );
    expect(mockProvider.call).not.toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[1].address]),
        to: COMET_CONTRACTS[1].address,
      },
      blockNumber
    );
    expect(mockProvider.call).not.toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[2].address]),
        to: COMET_CONTRACTS[1].address,
      },
      blockNumber
    );
    expect(mockProvider.call).toHaveBeenCalledWith(
      {
        data: COMET_IFACE.encodeFunctionData("isBorrowCollateralized", [borrowers[3].address]),
        to: COMET_CONTRACTS[1].address,
      },
      blockNumber
    );
  });

  it("should emit a finding for each large borrower whose borrow is not collateralized", async () => {
    const baseBorrowIndex = 250;
    const baseIndexScale = 100;
    const thresholdPrincipals = COMET_CONTRACTS.map((comet) =>
      ethers.BigNumber.from(comet.baseLargeThreshold).mul(-1).mul(baseIndexScale).div(baseBorrowIndex)
    );

    const previousBorrowers = [
      {
        address: createChecksumAddress("0xb01"),
        principal: thresholdPrincipals[0],
        comet: COMET_CONTRACTS[0].address,
        isCollateralized: false,
      },
      {
        address: createChecksumAddress("0xb02"),
        principal: thresholdPrincipals[1],
        comet: COMET_CONTRACTS[1].address,
        isCollateralized: true,
      },
    ];

    previousBorrowers.forEach((borrower, idx) => {
      addWithdrawal(borrower.comet, borrower.address, idx);
      setUserPrincipal(borrower.comet, borrower.address, borrower.principal, "latest");
    });

    await initialize();
    await initializationPromise;

    const currentBorrowers = [
      {
        address: createChecksumAddress("0xb03"),
        principal: thresholdPrincipals[0].sub(1),
        comet: COMET_CONTRACTS[0].address,
        isCollateralized: false,
      },
      {
        address: createChecksumAddress("0xb04"),
        principal: thresholdPrincipals[0].add(1),
        comet: COMET_CONTRACTS[0].address,
        isCollateralized: false,
      },
      {
        address: createChecksumAddress("0xb05"),
        principal: thresholdPrincipals[1].sub(1),
        comet: COMET_CONTRACTS[1].address,
        isCollateralized: false,
      },
      {
        address: createChecksumAddress("0xb06"),
        principal: thresholdPrincipals[1].add(1),
        comet: COMET_CONTRACTS[1].address,
        isCollateralized: false,
      },
    ];

    const blockNumber = 11;
    const blockTimestamp = 1000;
    const blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(blockTimestamp);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, baseBorrowIndex, blockNumber);
      setBaseIndexScale(comet.address, baseIndexScale, blockNumber);
    });

    currentBorrowers.forEach((borrower) => {
      addWithdrawal(borrower.comet, borrower.address, blockNumber);
      setUserPrincipal(borrower.comet, borrower.address, borrower.principal, blockNumber);
    });

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, baseBorrowIndex, blockNumber);
      setBaseIndexScale(comet.address, baseIndexScale, blockNumber);
    });

    [...previousBorrowers, ...currentBorrowers].forEach((borrower) => {
      setIsBorrowCollateralized(borrower.comet, borrower.address, borrower.isCollateralized, blockNumber);
    });

    const findings = await handleBlock(blockEvent);

    const presentValueBorrow = (principal: ethers.BigNumber) =>
      principal.mul(-1).mul(baseBorrowIndex).div(baseIndexScale);

    expect(findings.sort()).toStrictEqual(
      [
        createLiquidationRiskFinding(
          previousBorrowers[0].comet,
          previousBorrowers[0].address,
          presentValueBorrow(previousBorrowers[0].principal),
          network
        ),
        createLiquidationRiskFinding(
          currentBorrowers[0].comet,
          currentBorrowers[0].address,
          presentValueBorrow(currentBorrowers[0].principal),
          network
        ),
        createLiquidationRiskFinding(
          currentBorrowers[2].comet,
          currentBorrowers[2].address,
          presentValueBorrow(currentBorrowers[2].principal),
          network
        ),
      ].sort()
    );
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [
        {
          borrower: currentBorrowers[0].address,
          principal: currentBorrowers[0].principal,
          alertedAt: blockTimestamp,
        },
        {
          borrower: previousBorrowers[0].address,
          principal: previousBorrowers[0].principal,
          alertedAt: blockTimestamp,
        },
        {
          borrower: currentBorrowers[1].address,
          principal: currentBorrowers[1].principal,
          alertedAt: 0,
        },
      ],
      [COMET_CONTRACTS[1].address]: [
        {
          borrower: currentBorrowers[2].address,
          principal: currentBorrowers[2].principal,
          alertedAt: blockTimestamp,
        },
        {
          borrower: previousBorrowers[1].address,
          principal: previousBorrowers[1].principal,
          alertedAt: 0,
        },
        {
          borrower: currentBorrowers[3].address,
          principal: currentBorrowers[3].principal,
          alertedAt: 0,
        },
      ],
    });
  });
  it("should emit alerts at most as frequently as set by the alert interval", async () => {
    const baseBorrowIndex = 250;
    const baseIndexScale = 100;
    const thresholdPrincipal = ethers.BigNumber.from(COMET_CONTRACTS[0].baseLargeThreshold)
      .mul(-1)
      .mul(baseIndexScale)
      .div(baseBorrowIndex);

    const borrower = {
      address: createChecksumAddress("0xb01"),
      principal: thresholdPrincipal,
      comet: COMET_CONTRACTS[0].address,
      isCollateralized: false,
    };

    addWithdrawal(borrower.comet, borrower.address, 0);
    setUserPrincipal(borrower.comet, borrower.address, borrower.principal, "latest");

    await initialize();
    await initializationPromise;

    let blockNumber = 11;
    let blockTimestamp = 1000;
    let blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(blockTimestamp);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, baseBorrowIndex, blockNumber);
      setBaseIndexScale(comet.address, baseIndexScale, blockNumber);
    });

    setIsBorrowCollateralized(borrower.comet, borrower.address, borrower.isCollateralized, blockNumber);

    let findings = await handleBlock(blockEvent);
    const presentValueBorrow = (principal: ethers.BigNumber) =>
      principal.isNegative() ? principal.mul(-1).mul(baseBorrowIndex).div(baseIndexScale) : ethers.BigNumber.from(0);

    expect(findings).toStrictEqual([
      createLiquidationRiskFinding(borrower.comet, borrower.address, presentValueBorrow(borrower.principal), network),
    ]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [
        {
          borrower: borrower.address,
          principal: borrower.principal,
          alertedAt: blockTimestamp,
        },
      ],
      [COMET_CONTRACTS[1].address]: [],
    });

    blockNumber = blockNumber + 1;
    blockTimestamp = blockTimestamp + 1;
    blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(blockTimestamp);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, baseBorrowIndex, blockNumber);
      setBaseIndexScale(comet.address, baseIndexScale, blockNumber);
    });

    setIsBorrowCollateralized(borrower.comet, borrower.address, borrower.isCollateralized, blockNumber);

    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [
        {
          borrower: borrower.address,
          principal: borrower.principal,
          alertedAt: blockTimestamp - 1,
        },
      ],
      [COMET_CONTRACTS[1].address]: [],
    });

    blockNumber = blockNumber + 2;
    blockTimestamp = blockTimestamp + DEFAULT_CONFIG[network].alertInterval;
    blockEvent = new TestBlockEvent().setNumber(blockNumber).setTimestamp(blockTimestamp);

    COMET_CONTRACTS.forEach((comet) => {
      setBaseBorrowIndex(comet.address, baseBorrowIndex, blockNumber);
      setBaseIndexScale(comet.address, baseIndexScale, blockNumber);
    });

    setIsBorrowCollateralized(borrower.comet, borrower.address, borrower.isCollateralized, blockNumber);

    findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createLiquidationRiskFinding(borrower.comet, borrower.address, presentValueBorrow(borrower.principal), network),
    ]);
    expect(state.monitoringLists).toStrictEqual({
      [COMET_CONTRACTS[0].address]: [
        {
          borrower: borrower.address,
          principal: borrower.principal,
          alertedAt: blockTimestamp,
        },
      ],
      [COMET_CONTRACTS[1].address]: [],
    });
  });
});
