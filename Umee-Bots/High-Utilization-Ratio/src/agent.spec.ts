import BigNumber from "bignumber.js";
import { ethers, HandleBlock, HandleTransaction, Initialize } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent, TestBlockEvent, createAddress } from "forta-agent-tools/lib/tests";
import { provideHandleBlock, provideHandleTransaction, provideInitialize } from "./agent";
import {
  AGGREGATE_ABI,
  BALANCE_OF_ABI,
  GET_RESERVES_LIST_ABI,
  GET_RESERVE_DATA_ABI,
  RESERVE_INITIALIZED_ABI,
  TOTAL_SUPPLY_ABI,
} from "./constants";
import { MulticallContract, MulticallProvider } from "./multicall";
import { AgentConfig, createAbsoluteThresholdFinding, createPercentageThresholdFinding, ReserveData } from "./utils";

const MAINNET_MULTICALL_ADDRESS = "0xeefba1e63905ef1d7acba5a8513c70307c1ce441";
const LENDING_POOL_ADDRESS = createAddress("0x4001");
const LENDING_POOL_CONFIGURATOR_ADDRESS = createAddress("0x4001a");
const MULTICALL_IFACE = new ethers.utils.Interface([AGGREGATE_ABI]);
const LENDING_POOL_IFACE = new ethers.utils.Interface([GET_RESERVES_LIST_ABI, GET_RESERVE_DATA_ABI]);
const LENDING_POOL_CONFIGURATOR_IFACE = new ethers.utils.Interface([RESERVE_INITIALIZED_ABI]);
const ERC20_IFACE = new ethers.utils.Interface([BALANCE_OF_ABI, TOTAL_SUPPLY_ABI]);

const DEFAULT_CONFIG: AgentConfig = {
  absoluteThreshold: "0.95",
  percentageThreshold: "100",
  lendingPoolAddress: LENDING_POOL_ADDRESS,
  lendingPoolConfiguratorAddress: LENDING_POOL_CONFIGURATOR_ADDRESS,
  alertCooldown: {
    absolute: 600,
    percentage: 0,
  },
};

describe("High utilization ratio bot", () => {
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let provider: ethers.providers.Provider;
  let multicallProvider: MulticallProvider;
  let mockProvider: MockEthersProvider;
  let mockMulticallProvider: MockEthersProvider;
  let reserveData: ReserveData[] = [];

  const resetReserveData = () => (reserveData.length = 0);
  const setReserveData = (newReserveData: ReserveData[]) => {
    resetReserveData();
    reserveData.push(...newReserveData);
  };

  function generateMockProviderCall() {
    const _call = mockProvider.call;

    mockProvider.call = jest.fn().mockImplementation(({ data, to, from }, blockTag) => {
      if (to.toLowerCase() === MAINNET_MULTICALL_ADDRESS) {
        const calls = MULTICALL_IFACE.decodeFunctionData("aggregate", data).calls as Array<{
          callData: string;
          target: string;
        }>;
        const results = calls.map((call) =>
          mockMulticallProvider.call({ data: call.callData, to: call.target }, blockTag)
        );
        return MULTICALL_IFACE.encodeFunctionResult("aggregate", [ethers.BigNumber.from(blockTag), results]);
      } else {
        return _call({ data, to, from });
      }
    });
  }

  function clearProviderCalls() {
    mockProvider.call.mockClear();
    mockMulticallProvider.call.mockClear();
  }

  function setReserves(reserves: string[], block?: string | number, txEvent?: TestTransactionEvent) {
    mockProvider.addCallTo(LENDING_POOL_ADDRESS, block as any, LENDING_POOL_IFACE, "getReservesList", {
      inputs: [],
      outputs: [reserves],
    });

    reserves.forEach((reserve) => {
      addReserveData(reserve, block);

      if (txEvent) {
        txEvent.addInterfaceEventLog(
          LENDING_POOL_CONFIGURATOR_IFACE.getEvent("ReserveInitialized"),
          LENDING_POOL_CONFIGURATOR_ADDRESS,
          [reserve, ...Object.values(getReserveAddresses(reserve)), createAddress("0x0")]
        );
      }
    });
  }

  function setReserveBalances(
    reserve: string,
    assetBalance: ethers.BigNumberish,
    stableDebtTokenSupply: ethers.BigNumberish,
    variableDebtTokenSupply: ethers.BigNumberish,
    block?: string | number
  ) {
    const addresses = getReserveAddresses(reserve);

    mockMulticallProvider.addCallTo(reserve, block as any, ERC20_IFACE, "balanceOf", {
      inputs: [addresses.uTokenAddress],
      outputs: [assetBalance],
    });

    mockMulticallProvider.addCallTo(addresses.stableDebtTokenAddress, block as any, ERC20_IFACE, "totalSupply", {
      inputs: [],
      outputs: [stableDebtTokenSupply],
    });

    mockMulticallProvider.addCallTo(addresses.variableDebtTokenAddress, block as any, ERC20_IFACE, "totalSupply", {
      inputs: [],
      outputs: [variableDebtTokenSupply],
    });
  }

  function getReserveAddresses(reserve: string) {
    return {
      uTokenAddress: `0x1${reserve.slice(3)}`,
      stableDebtTokenAddress: `0x2${reserve.slice(3)}`,
      variableDebtTokenAddress: `0x3${reserve.slice(3)}`,
    };
  }

  function createReserveData(reserve: string): ReserveData {
    const addresses = getReserveAddresses(reserve);

    return {
      asset: new MulticallContract(reserve, [BALANCE_OF_ABI]),
      uTokenAddress: addresses.uTokenAddress,
      stableDebtToken: new MulticallContract(addresses.stableDebtTokenAddress, [TOTAL_SUPPLY_ABI]),
      variableDebtToken: new MulticallContract(addresses.variableDebtTokenAddress, [TOTAL_SUPPLY_ABI]),
      usageRatio: new BigNumber(-1),
      lastAlertTimestamp: {
        absolute: 0,
        percentage: 0,
      },
    };
  }

  function addReserveData(reserve: string, block?: string | number) {
    mockProvider.addCallTo(LENDING_POOL_ADDRESS, block as any, LENDING_POOL_IFACE, "getReserveData", {
      inputs: [reserve],
      outputs: [
        {
          configuration: { data: ethers.BigNumber.from(0) },
          liquidityIndex: ethers.BigNumber.from(0),
          variableBorrowIndex: ethers.BigNumber.from(0),
          currentLiquidityRate: ethers.BigNumber.from(0),
          currentVariableBorrowRate: ethers.BigNumber.from(0),
          currentStableBorrowRate: ethers.BigNumber.from(0),
          lastUpdateTimestamp: ethers.BigNumber.from(0),
          ...getReserveAddresses(reserve),
          interestRateStrategyAddress: createAddress("0x0"),
          id: ethers.BigNumber.from(0),
        },
      ],
    });
  }

  function copyReserveData(reserveData: ReserveData[]) {
    return reserveData.map((el) => ({
      ...el,
      lastAlertTimestamp: {
        ...el.lastAlertTimestamp,
      },
    }));
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;
    mockMulticallProvider = new MockEthersProvider();

    generateMockProviderCall();

    // @ts-ignore
    mockProvider.getNetwork = jest.fn().mockImplementation(() => ({ chainId: 1 }));

    multicallProvider = new MulticallProvider(provider);
    await multicallProvider.init();

    resetReserveData();
  });

  describe("initialize", () => {
    it("should fetch the reserves list", async () => {
      initialize = provideInitialize(reserveData, provider, DEFAULT_CONFIG);

      const reserves = [createAddress("0x1"), createAddress("0x2")];
      setReserves(reserves);

      await initialize();

      reserves.forEach((reserve, idx) => {
        const addresses = getReserveAddresses(reserve);
        const data = reserveData[idx];

        expect(data.asset.address).toStrictEqual(reserve);
        expect(data.uTokenAddress).toStrictEqual(addresses.uTokenAddress);
        expect(data.stableDebtToken.address).toStrictEqual(addresses.stableDebtTokenAddress);
        expect(data.variableDebtToken.address).toStrictEqual(addresses.variableDebtTokenAddress);
        expect(data.usageRatio.toString(10)).toStrictEqual("-1");
        expect(data.lastAlertTimestamp.absolute).toStrictEqual(0);
        expect(data.lastAlertTimestamp.percentage).toStrictEqual(0);
      });
    });
  });

  describe("handleTransaction", () => {
    it("should include newly added reserves to the monitoring list", async () => {
      handleTransaction = provideHandleTransaction(reserveData, DEFAULT_CONFIG);

      const txEvent = new TestTransactionEvent();

      const reserves = [createAddress("0x3"), createAddress("0x4")];
      setReserves(reserves, undefined, txEvent);

      await handleTransaction(txEvent);

      reserves.forEach((reserve, idx) => {
        const addresses = getReserveAddresses(reserve);
        const data = reserveData[idx];

        expect(data.asset.address).toStrictEqual(reserve);
        expect(data.uTokenAddress).toStrictEqual(addresses.uTokenAddress);
        expect(data.stableDebtToken.address).toStrictEqual(addresses.stableDebtTokenAddress);
        expect(data.variableDebtToken.address).toStrictEqual(addresses.variableDebtTokenAddress);
        expect(data.usageRatio.toString(10)).toStrictEqual("-1");
        expect(data.lastAlertTimestamp.absolute).toStrictEqual(0);
        expect(data.lastAlertTimestamp.percentage).toStrictEqual(0);
      });
    });
  });

  describe("handleBlock", () => {
    it("should return empty findings with an empty monitoring list", async () => {
      handleBlock = provideHandleBlock(reserveData, multicallProvider, DEFAULT_CONFIG);

      const blockEvent = new TestBlockEvent();
      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([]);
      expect(mockProvider.call).toBeCalledTimes(0);
    });

    it("should split reserve list into chunks of 10 for multicall", async () => {
      handleBlock = provideHandleBlock(reserveData, multicallProvider, DEFAULT_CONFIG);

      // 10 reserves should require 1 multicall
      const reserves1 = new Array(10).fill(createAddress("0x1"));
      reserveData.push(...reserves1.map((reserve) => createReserveData(reserve)));
      setReserveBalances(createAddress("0x1"), "1", "1", "1", 0);

      const blockEvent1 = new TestBlockEvent().setNumber(0);
      const findings1 = await handleBlock(blockEvent1);

      expect(findings1).toStrictEqual([]);
      expect(mockProvider.call).toBeCalledTimes(1);
      expect(mockMulticallProvider.call).toBeCalledTimes(3 * 10);

      clearProviderCalls();
      resetReserveData();

      // 10 reserves should require 2 multicalls
      const reserves2 = new Array(11).fill(createAddress("0x1"));
      reserveData.push(...reserves2.map((reserve) => createReserveData(reserve)));
      setReserveBalances(createAddress("0x1"), "1", "1", "1", 0);

      const blockEvent2 = new TestBlockEvent().setNumber(0);
      const findings2 = await handleBlock(blockEvent2);

      expect(findings2).toStrictEqual([]);
      expect(mockProvider.call).toBeCalledTimes(2);
      expect(mockMulticallProvider.call).toBeCalledTimes(3 * 11);
    });

    it("should emit a finding if a reserve's usage ratio is greater than or equal to an absolute threshold", async () => {
      const config: AgentConfig = {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "0.7",
        alertCooldown: { absolute: 0, percentage: 0 },
      };

      handleBlock = provideHandleBlock(reserveData, multicallProvider, config);

      const reserves = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];
      reserveData.push(...reserves.map((reserve) => createReserveData(reserve)));

      const blockEvent = new TestBlockEvent().setNumber(0).setTimestamp(1000);
      setReserveBalances(reserves[0], "1", "1", "1", 0);
      setReserveBalances(reserves[1], "1", "10", "1", 0);
      setReserveBalances(reserves[2], "1", "10", "10", 0);

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        createAbsoluteThresholdFinding(reserves[1], new BigNumber("11").div("12")),
        createAbsoluteThresholdFinding(reserves[2], new BigNumber("20").div("21")),
      ]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual(new BigNumber("2").div("3").toString());
      expect(reserveData[1].usageRatio.toString()).toStrictEqual(new BigNumber("11").div("12").toString());
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("20").div("21").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(blockEvent.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(blockEvent.block.timestamp);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(0);
    });

    it("should emit a finding if a reserve's usage ratio increase greater than or equal to a percentage threshold", async () => {
      const config: AgentConfig = {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "100000",
        percentageThreshold: "10",
        alertCooldown: { absolute: 0, percentage: 0 },
      };

      handleBlock = provideHandleBlock(reserveData, multicallProvider, config);

      const reserves = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];
      reserveData.push(...reserves.map((reserve) => createReserveData(reserve)));

      setReserveBalances(reserves[0], "5", "10", "10", 0); // 0.8
      setReserveBalances(reserves[1], "10", "100", "10", 0); // ~0.917
      setReserveBalances(reserves[2], "10", "100", "100", 0); // ~0.952

      setReserveBalances(reserves[0], "5", "10", "35", 1); // 0.9
      setReserveBalances(reserves[1], "10", "100", "10", 1); // ~0.917
      setReserveBalances(reserves[2], "1000", "100", "100", 1); // ~0.167

      const blockEvent1 = new TestBlockEvent().setNumber(0).setTimestamp(1000);
      const findings1 = await handleBlock(blockEvent1);

      expect(findings1).toStrictEqual([]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.8");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual(new BigNumber("110").div("120").toString());
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("200").div("210").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(0);

      const blockEvent2 = new TestBlockEvent().setNumber(1).setTimestamp(2000);
      const findings2 = await handleBlock(blockEvent2);

      expect(findings2).toStrictEqual([
        createPercentageThresholdFinding(
          reserves[0],
          new BigNumber("0.9"),
          new BigNumber("9").div("8").minus("1").shiftedBy(2)
        ),
      ]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.9");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual(new BigNumber("110").div("120").toString());
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("200").div("1200").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(blockEvent2.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(0);
    });

    it("should be able to emit multiple findings for one and multiple reserves", async () => {
      const config: AgentConfig = {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "0.95",
        percentageThreshold: "1",
        alertCooldown: { absolute: 0, percentage: 0 },
      };

      handleBlock = provideHandleBlock(reserveData, multicallProvider, config);

      const reserves = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];
      reserveData.push(...reserves.map((reserve) => createReserveData(reserve)));

      setReserveBalances(reserves[0], "5", "10", "10", 0); // 0.8
      setReserveBalances(reserves[1], "10", "100", "10", 0); // ~0.917
      setReserveBalances(reserves[2], "10", "100", "100", 0); // ~0.952

      setReserveBalances(reserves[0], "5", "10", "35", 1); // 0.9
      setReserveBalances(reserves[1], "10", "100", "100", 1); // ~0.952
      setReserveBalances(reserves[2], "1000", "100", "100", 1); // ~0.167

      const blockEvent1 = new TestBlockEvent().setNumber(0).setTimestamp(1000);
      const findings1 = await handleBlock(blockEvent1);

      expect(findings1).toStrictEqual([createAbsoluteThresholdFinding(reserves[2], new BigNumber("200").div("210"))]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.8");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual(new BigNumber("110").div("120").toString());
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("200").div("210").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(blockEvent1.block.timestamp);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(0);

      const blockEvent2 = new TestBlockEvent().setNumber(1).setTimestamp(2000);
      const findings2 = await handleBlock(blockEvent2);

      expect(findings2).toStrictEqual([
        createPercentageThresholdFinding(
          reserves[0],
          new BigNumber("0.9"),
          new BigNumber("9").div("8").minus("1").shiftedBy(2)
        ),
        createAbsoluteThresholdFinding(reserves[1], new BigNumber("200").div("210")),
        createPercentageThresholdFinding(
          reserves[1],
          new BigNumber("200").div("210"),
          new BigNumber("200").div("210").div(new BigNumber("110").div("120")).minus("1").shiftedBy(2)
        ),
      ]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.9");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual(new BigNumber("200").div("210").toString());
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("200").div("1200").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(blockEvent2.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(blockEvent2.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(blockEvent2.block.timestamp);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(blockEvent1.block.timestamp);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(0);
    });

    it("shouldn't emit a finding while a reserve's cooldown period is up", async () => {
      const config: AgentConfig = {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "0.9",
        percentageThreshold: "10",
        alertCooldown: { absolute: 15, percentage: 20 },
      };

      handleBlock = provideHandleBlock(reserveData, multicallProvider, config);

      const reserves = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];
      reserveData.push(...reserves.map((reserve) => createReserveData(reserve)));

      setReserveBalances(reserves[0], "5", "10", "5", 0); // 0.75
      setReserveBalances(reserves[1], "5", "20", "20", 0); // ~0.889
      setReserveBalances(reserves[2], "5", "1", "4", 0); // 0.5

      setReserveBalances(reserves[0], "5", "1", "4", 1); // 0.5
      setReserveBalances(reserves[1], "5", "20", "25", 1); // 0.9 -> >= absolute threshold
      setReserveBalances(reserves[2], "5", "10", "5", 1); // 0.75 -> >= relative threshold

      setReserveBalances(reserves[0], "5", "1", "4", 2); // 0.5
      setReserveBalances(reserves[1], "5", "20", "25", 2); // 0.9 -> >= absolute threshold
      setReserveBalances(reserves[2], "5", "20", "5", 2); // ~0.833 -> >= relative threshold

      const blockEvent1 = new TestBlockEvent().setNumber(0).setTimestamp(1000);
      const findings1 = await handleBlock(blockEvent1);

      expect(findings1).toStrictEqual([]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.75");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual(new BigNumber("40").div("45").toString());
      expect(reserveData[2].usageRatio.toString()).toStrictEqual("0.5");
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(0);

      const blockEvent2 = new TestBlockEvent().setNumber(1).setTimestamp(2000);
      const findings2 = await handleBlock(blockEvent2);

      expect(findings2).toStrictEqual([
        createAbsoluteThresholdFinding(reserves[1], new BigNumber("0.9")),
        createPercentageThresholdFinding(
          reserves[2],
          new BigNumber("0.75"),
          new BigNumber("0.75").div("0.5").minus("1").shiftedBy(2)
        ),
      ]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.5");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual("0.9");
      expect(reserveData[2].usageRatio.toString()).toStrictEqual("0.75");
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(blockEvent2.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(blockEvent2.block.timestamp);

      const reserveDataBackup = copyReserveData(reserveData);
      setReserveData(copyReserveData(reserveDataBackup)); // restore to point after blockEvent2

      // if the timestamp stays the same, findings shouldn't be emitted
      const blockEvent3 = new TestBlockEvent().setNumber(2).setTimestamp(2000);
      expect(await handleBlock(blockEvent3)).toStrictEqual([]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.5");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual("0.9");
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("25").div("30").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(blockEvent2.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(blockEvent2.block.timestamp);

      setReserveData(copyReserveData(reserveDataBackup)); // restore to point after blockEvent2

      // if the timestamp is above the absolute finding cooldown, an absolute finding should be emitted
      const blockEvent4 = new TestBlockEvent()
        .setNumber(2)
        .setTimestamp(blockEvent3.block.timestamp + config.alertCooldown.absolute);
      expect(await handleBlock(blockEvent4)).toStrictEqual([
        createAbsoluteThresholdFinding(reserves[1], new BigNumber("0.9")),
      ]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.5");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual("0.9");
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("25").div("30").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(blockEvent4.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(blockEvent2.block.timestamp);

      setReserveData(copyReserveData(reserveDataBackup)); // restore to point after blockEvent2

      // if the timestamp is above the percentage finding cooldown (which is greater than the absolute finding cooldown), both findings should be emitted
      const blockEvent5 = new TestBlockEvent()
        .setNumber(2)
        .setTimestamp(blockEvent3.block.timestamp + config.alertCooldown.percentage);
      expect(await handleBlock(blockEvent5)).toStrictEqual([
        createAbsoluteThresholdFinding(reserves[1], new BigNumber("0.9")),
        createPercentageThresholdFinding(
          reserves[2],
          new BigNumber("25").div("30"),
          new BigNumber("25").div("30").div("0.75").minus("1").shiftedBy(2)
        ),
      ]);
      expect(reserveData[0].usageRatio.toString()).toStrictEqual("0.5");
      expect(reserveData[1].usageRatio.toString()).toStrictEqual("0.9");
      expect(reserveData[2].usageRatio.toString()).toStrictEqual(new BigNumber("25").div("30").toString());
      expect(reserveData[0].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[0].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[1].lastAlertTimestamp.absolute).toStrictEqual(blockEvent5.block.timestamp);
      expect(reserveData[1].lastAlertTimestamp.percentage).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.absolute).toStrictEqual(0);
      expect(reserveData[2].lastAlertTimestamp.percentage).toStrictEqual(blockEvent5.block.timestamp);
    });
  });
});
