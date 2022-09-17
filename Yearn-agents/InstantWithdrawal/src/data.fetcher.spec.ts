import DataFetcher from "./data.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { vaultRegistryInterface, vaultInterface } from "./abi";
import { makeRequestOptions } from "./utils";
import { BigNumber } from "ethers";

describe("DataFetcher tests suite", () => {
  const mockAxios = jest.fn();
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: DataFetcher = new DataFetcher(mockProvider as any, mockAxios);
  const createFork = jest.fn();

  const prepareAxios = (size: number, vault: string) => {
    const inv = buildInvestors(size, vault);
    mockAxios.mockReturnValueOnce({
      data: {
        data: {
          accountVaultPositions: inv,
        },
      },
    });
    return inv;
  };

  const buildInvestors = (size: number, vault: string) => {
    const inv: any[] = [];
    for (let i = 0; i < size; ++i) {
      inv.push({
        vault: { id: vault },
        account: { id: createAddress(`0xe0a${i}`) },
      });
    }
    return inv;
  };

  const acum = (data: string[]) => data.map((x) => BigNumber.from(x)).reduce((acum, cur) => acum.add(cur));

  beforeAll(() => createFork.mockReturnValue(mockProvider));

  beforeEach(() => {
    mockProvider.clear();
    mockAxios.mockClear();
  });

  it("should return the correct block number", async () => {
    const CASES: number[] = [1, 10, 20, 9, 0, 201209];

    for (let block of CASES) {
      mockProvider.setLatestBlock(block);
      expect(await fetcher.getBlockNumber()).toStrictEqual(block);
    }
  });

  it("should return the assets", async () => {
    const CASES: string[][] = [
      [createAddress("0xdef1"), createAddress("0xda0"), createAddress("0xe0a")],
      [createAddress("0xdef1"), createAddress("0xe0a")],
      [createAddress("0xda0")],
    ];

    for (let i = 0; i < CASES.length; ++i) {
      const [registry, ...assets] = CASES[i];
      mockProvider.addCallTo(registry, i, vaultRegistryInterface, "assetsAddresses", {
        inputs: [],
        outputs: [assets],
      });

      expect(await fetcher.getVaults(registry, i)).toStrictEqual(assets);
    }
  });

  it("should return the getBiggerInvestors", async () => {
    // vault, num of investors
    const CASES: [string, number][] = [
      [createAddress("0xdef1"), 3],
      [createAddress("0xdA0"), 10],
      [createAddress("0xe0a"), 5],
    ];

    for (let [vault, size] of CASES) {
      const inv = prepareAxios(size, vault);

      expect(await fetcher.getBiggerInvestors(vault)).toStrictEqual(inv);
      // minimal sharing to avoid duplicating the request creator code
      expect(mockAxios).lastCalledWith(makeRequestOptions(vault.toLowerCase()));
    }
  });

  it("should execute the withdrawals", async () => {
    const CASES: [string, string, number, number][] = [
      [createAddress("0xabc1"), createAddress("0xdef7"), 2000, 5],
      [createAddress("0xabc5"), createAddress("0xdef6"), 500, 5],
      [createAddress("0xabc4"), createAddress("0xdef8"), 10, 3],
      [createAddress("0xabc3"), createAddress("0xdef9"), 42, 15],
      [createAddress("0xabc2"), createAddress("0xdef0"), 1000, 1000],
    ];

    for (let [vault, investor, oldAmount, newAmount] of CASES) {
      mockProvider
        .addCallFrom(vault, investor, "latest", vaultInterface, "balanceOf", {
          inputs: [investor],
          outputs: [newAmount],
        })
        .addSigner(investor)
        .getSigner(investor)
        .allowTransaction(investor, vault, vaultInterface, "withdraw", [oldAmount], "wiiii");

      expect(
        await fetcher.withdrawForUser(
          {
            vault: { id: vault },
            account: { id: investor },
          },
          BigNumber.from(oldAmount),
          mockProvider as any
        )
      ).toStrictEqual(BigNumber.from(oldAmount - newAmount));
    }
  });

  it("should return the stats for a vault", async () => {
    // num of investors, blockNumber, supply, vault, initial balance [], final balance []
    const CASES: [number, number, string, string, string[], string[]][] = [
      [1, 2, "11111111", createAddress("0xda01"), ["50"], ["20"]],
      [2, 5, "11129111", createAddress("0xda02"), ["1111", "234"], ["1000", "234"]],
      [3, 9, "11138111", createAddress("0xda03"), ["11111110", "0", "1"], ["0", "0", "0"]],
      [3, 4, "11147111", createAddress("0xda04"), ["20", "30", "40"], ["10", "20", "30"]],
      [2, 1, "11156111", createAddress("0xda05"), ["50", "100"], ["50", "100"]],
    ];

    for (let [numOfInvestors, block, supply, vault, iBalance, fBalance] of CASES) {
      const inv = buildInvestors(numOfInvestors, vault);

      mockProvider.addCallTo(vault, "latest", vaultInterface, "totalSupply", {
        inputs: [],
        outputs: [supply],
      });

      const investors: string[] = [];
      for (let i = 0; i < numOfInvestors; ++i) {
        const investor: string = createAddress(`0xe0a${i}`);
        investors.push(investor);
        mockProvider
          .addCallTo(vault, "latest", vaultInterface, "balanceOf", {
            inputs: [investor],
            outputs: [iBalance[i]],
          })
          .addCallFrom(vault, investor, "latest", vaultInterface, "balanceOf", {
            inputs: [investor],
            outputs: [fBalance[i]],
          })
          .addSigner(investor)
          .getSigner(investor)
          .allowTransaction(investor, vault, vaultInterface, "withdraw", [iBalance[i]], {});
      }

      const initialAcum: BigNumber = acum(iBalance);
      const finalAcum: BigNumber = initialAcum.sub(acum(fBalance));
      const [_vault, totalSupply, totalInvestorValues, ableToWithdrawn] = await fetcher.getStatsForVault(
        inv,
        block,
        createFork as any
      );

      expect(createFork).lastCalledWith(block, investors);
      expect(_vault).toStrictEqual(vault);
      expect(totalSupply).toStrictEqual(BigNumber.from(supply));
      expect(totalInvestorValues).toStrictEqual(initialAcum);
      expect(ableToWithdrawn).toStrictEqual(finalAcum);
    }
  });

  it("should return stats for all the vaults", async () => {
    const block: number = 50;
    const registry: string = createAddress("0xdead");
    const vaults: string[] = [createAddress("0xdef10"), createAddress("0xdef1013214"), createAddress("0xbaddef1")];

    mockProvider.setLatestBlock(block).addCallTo(registry, block, vaultRegistryInterface, "assetsAddresses", {
      inputs: [],
      outputs: [vaults],
    });

    // num of investors, supply, vault, initial balance [], final balance []
    const vaultsData: [number, string, string, string[], string[]][] = [
      [2, "1000", vaults[0], ["10", "900"], ["9", "500"]],
      [1, "2000", vaults[1], ["1000"], ["2"]],
      [0, "999", vaults[2], [], []], // should be discarted
    ];

    const expectedData: [string, BigNumber, BigNumber, BigNumber][] = [];
    for (let [numOfInvestors, supply, vault, iBalance, fBalance] of vaultsData) {
      prepareAxios(numOfInvestors, vault);

      if (numOfInvestors === 0) continue;

      mockProvider.addCallTo(vault, "latest", vaultInterface, "totalSupply", {
        inputs: [],
        outputs: [supply],
      });

      for (let i = 0; i < numOfInvestors; ++i) {
        const investor: string = createAddress(`0xe0a${i}`);
        mockProvider
          .addCallTo(vault, "latest", vaultInterface, "balanceOf", {
            inputs: [investor],
            outputs: [iBalance[i]],
          })
          .addCallFrom(vault, investor, "latest", vaultInterface, "balanceOf", {
            inputs: [investor],
            outputs: [fBalance[i]],
          })
          .addSigner(investor)
          .getSigner(investor)
          .allowTransaction(investor, vault, vaultInterface, "withdraw", [iBalance[i]], {});
      }

      const initialAcum: BigNumber = acum(iBalance);
      const finalAcum: BigNumber = initialAcum.sub(acum(fBalance));

      expectedData.push([vault, BigNumber.from(supply), initialAcum, finalAcum]);
    }

    const data: [string, BigNumber, BigNumber, BigNumber][] = await fetcher.getStats(registry, createFork);
    expect(data).toStrictEqual(expectedData);
  });
});
