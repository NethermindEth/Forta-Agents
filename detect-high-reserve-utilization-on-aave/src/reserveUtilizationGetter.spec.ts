import Web3 from "web3";
import ReserveUtilizationGetter from "./reserveUtilizationGetter";
import { encodeGetReserveDataReturn } from "./abi.utils";

const ASSET_ADDRESSES = {
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};

const RESERVE_DATA: { [key: string]: string } = {
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
  "0xdac17f958d2ee523a2206206994597c13d831ec7": encodeGetReserveDataReturn([
    19,
    36,
    45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]),
};

describe("ReserveUtilizationGetter test suite", () => {
    const mockWeb3: Web3 = {
      eth: {
        call: jest.fn(({ data }) => {
            const assetAddress: string = "0x" + (data as string).slice(34);
            return RESERVE_DATA[assetAddress];
        }),
      },
    } as any;

  it("should return correct utilization values", async () => {
    const utilizationGetter: ReserveUtilizationGetter = new ReserveUtilizationGetter(
        mockWeb3
    );
    RESERVE_DATA[ASSET_ADDRESSES.USDC];
    const usdcUtilization: bigint = await utilizationGetter.getUtilization(
      ASSET_ADDRESSES.USDC
    );
    const daiUtilization: bigint = await utilizationGetter.getUtilization(
      ASSET_ADDRESSES.DAI
    );
    const usdtUtilization: bigint = await utilizationGetter.getUtilization(
      ASSET_ADDRESSES.USDT
    );

    expect(usdcUtilization.toString()).toStrictEqual("88");
    expect(daiUtilization.toString()).toStrictEqual("78");
    expect(usdtUtilization.toString()).toStrictEqual("81");
  });
});
