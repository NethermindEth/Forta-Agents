import MockProvider from "./mock.provider";
import PairFetcher from "./pairs.fetcher";
import { createAddress } from "forta-agent-tools";

describe("PairFetcher test suite", () => {
  const factory: string = "0xdead";
  const mockProvider: MockProvider = new MockProvider();
  const fetcher: PairFetcher = new PairFetcher(factory, mockProvider as any);

  it("should store the redeemHelper address correctly", async () => {
    for (let i = 0; i < 10; ++i) {
      const addr: string = createAddress(`0xDA0${i}`);
      const fetcher: PairFetcher = new PairFetcher(addr, mockProvider as any);

      expect(fetcher.factory).toStrictEqual(addr);
    }
  });
});
