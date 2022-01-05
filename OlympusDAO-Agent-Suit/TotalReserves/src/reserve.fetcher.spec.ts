import MockProvider from "./mock.provider";
import ReserveFetcher from "./reserve.fetcher";
import { createAddress } from "forta-agent-tools";
import { BigNumber } from "ethers";
import abi from "./abi";

describe("ReserveFetcher tests suite", () => {
  const provider: MockProvider = new MockProvider();

  it("should store the contract correctly", async () => {
    for(let i = 0; i <= 30; ++i){
      const addr: string = createAddress(`0x${i}`);
      const fetcher = new ReserveFetcher(addr, provider as any);
      expect(fetcher.treasury).toStrictEqual(addr);
    }
  });

  it("should return the correct totalReserves amount", async () => {
    const treasury: string = createAddress("0xc0de");
    const fetcher = new ReserveFetcher(treasury, provider as any);

    provider
      .addCallTo(
        treasury,
        50,
        abi.TREASURY_IFACE,
        "totalReserves",
        {inputs: [], outputs: [20]},
      )
      .addCallTo(
        treasury,
        23,
        abi.TREASURY_IFACE,
        "totalReserves",
        {inputs: [], outputs: [200]},
      );

    // Fetching initial reserves
    let block51reserve: BigNumber = await fetcher.getLastSeenReserve(51);
    let block24reserve: BigNumber = await fetcher.getLastSeenReserve(24);

    expect(block51reserve).toStrictEqual(BigNumber.from(20));
    expect(block24reserve).toStrictEqual(BigNumber.from(200));

    // clear the mock
    provider.clear();

    // Fetch cached values
    block51reserve = await fetcher.getLastSeenReserve(51);
    block24reserve = await fetcher.getLastSeenReserve(24);

    expect(block51reserve).toStrictEqual(BigNumber.from(20));
    expect(block24reserve).toStrictEqual(BigNumber.from(200));

    // Update values
    fetcher.update(51, BigNumber.from(123));
    fetcher.update(24, BigNumber.from(321));

    block51reserve = await fetcher.getLastSeenReserve(51);
    block24reserve = await fetcher.getLastSeenReserve(24);

    expect(block51reserve).toStrictEqual(BigNumber.from(123));
    expect(block24reserve).toStrictEqual(BigNumber.from(321));
  });
});
