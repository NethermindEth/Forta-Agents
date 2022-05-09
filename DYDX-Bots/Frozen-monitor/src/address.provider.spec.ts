import { createAddress } from "forta-agent-tools/lib/tests";
import AddressProvider from "./address.provider";

const TEST_ADDRESSES: [string, string][] = [
  [createAddress("0xb1"), createAddress("0xb2")],
  [createAddress("0xc1"), createAddress("0xc2")],
  [createAddress("0xd1"), createAddress("0xd2")],
  [createAddress("0xe1"), createAddress("0xe2")],
];
const TEST_NETWORKS: string[] = ["1", "2", "3", "4", "5"];

describe("AddressProvider test suite", () => {
  it("should store addresses correctly", async () => {
    for (let [mainnetAddress, ropstenAddress] of TEST_ADDRESSES) {
      const provider = new AddressProvider(mainnetAddress, ropstenAddress);
      expect(provider.mainnetPrepetualProxy).toStrictEqual(mainnetAddress);
      expect(provider.ropstenPerpetualProxy).toStrictEqual(ropstenAddress);
    }
  });

  it("should set networkId correctly", async () => {
    const provider = new AddressProvider(TEST_ADDRESSES[0][0], TEST_ADDRESSES[0][1]);

    for (let networkId of TEST_NETWORKS) {
      provider.setNetwork(networkId);
      expect(provider.networkId).toStrictEqual(networkId);
    }
  });

  it("should return the correct contract address", async () => {
    for (let [mainnetAddress, ropstenAddress] of TEST_ADDRESSES) {
      const provider = new AddressProvider(mainnetAddress, ropstenAddress);

      provider.setNetwork("1");
      expect(provider.getAddress()).toStrictEqual(mainnetAddress);

      provider.setNetwork("3");
      expect(provider.getAddress()).toStrictEqual(ropstenAddress);

      provider.setNetwork("5");
      expect(provider.getAddress()).toStrictEqual("");
    }
  });
});
