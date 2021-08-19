import Web3 from "web3";
import { encodeGetReserveDataReturn } from "./abi.utils";

const ASSET_ADDRESSES = {
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};

const RESERVE_DATA: { [key:string] : string } = {
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": encodeGetReserveDataReturn([
    12,
    46,
    42,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]),
  "0x6b175474e89094c44da98b954eedeac495271d0f": encodeGetReserveDataReturn([
    22,
    36,
    42,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]),
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": encodeGetReserveDataReturn([
    19,
    36,
    55,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]),
};

describe("ReserveUtilizationGetter test suite", async () => {
  const mockWeb3: Web3 = {
    eth: {
      call: jest.fn(({ data }) => {
          const assetAddress: string = "0x" + (data as string).slice(10);
          return RESERVE_DATA[assetAddress];
      }),
    },
  } as any;

  it("should return correct utilization values", async () => {
    const utilizationGetter: ReserveUtilizationGetter = new ReserveUtilizationGetter(mockWeb3);

    const usdcUtilization: bigint = await utilizationGetter.getUtilization(ASSET_ADDRESSES.USDC);
    const daiUtilization: bigint = await utilizationGetter.getUtilization(ASSET_ADDRESSES.DAI);
    const usdtUtilization: bigint = await utilizationGetter.getUtilization(ASSET_ADDRESSES.USDT);

    expect(usdcUtilization).toStrictEqual(88);
    expect(daiUtilization).toStrictEqual(78);
    expect(usdtUtilization).toStrictEqual(81);
  })
});
