import { BigNumber } from "ethers";
import HatFetcher from "./hat.fetcher";
import { mockWrapper } from "./test.utils";
import { createAddress } from "forta-agent-tools/lib/tests";

describe("HatFetcher test suite", () => {
  const chief: string = createAddress("0xdead");
  const addr1: string = createAddress("0x1");
  const addr2: string = createAddress("0x2");
  const addr3: string = createAddress("0x3");
  const { setHat, setApproval, mockProvider } = mockWrapper(chief);
  let mockAddressFetcher: any;
  let hatFetcher: HatFetcher;

  beforeAll(() => {
    mockAddressFetcher = {
      getChiefAddress: jest.fn(),
      chiefAddress: chief,
    };
    hatFetcher = new HatFetcher(mockAddressFetcher, mockProvider as any);
  });
  beforeEach(() => mockProvider.clear());

  it("should fetch the hat properly", async () => {
    // request uncached block
    setHat(1, addr1);
    let hat = await hatFetcher.getHat(1);
    expect(hat).toStrictEqual(addr1);
    // request cached block
    mockProvider.clear();
    hat = await hatFetcher.getHat(1);
    expect(hat).toStrictEqual(addr1);
    // request uncached block
    setHat(2, addr2);
    hat = await hatFetcher.getHat(2);
    expect(hat).toStrictEqual(addr2);
    // request uncached block
    setHat(20, addr3);
    hat = await hatFetcher.getHat(20);
    expect(hat).toStrictEqual(addr3);
    // request the cached value several times
    mockProvider.clear();
    hat = await hatFetcher.getHat(20);
    expect(hat).toStrictEqual(addr3);
    hat = await hatFetcher.getHat(20);
    expect(hat).toStrictEqual(addr3);
    hat = await hatFetcher.getHat(20);
    expect(hat).toStrictEqual(addr3);
  });

  it("should fetch the approvals properly", async () => {
    // setting some hats & approvals for different blocks
    setApproval(1, createAddress("0xdef1"), 10);
    setApproval(10, createAddress("0xe0a"), 20);
    setApproval(100, createAddress("0xda0"), 30000);

    // get approvals from different blocks
    await hatFetcher.getHat(1);
    let approvals: BigNumber = await hatFetcher.getHatApprovals(1);
    expect(approvals).toStrictEqual(BigNumber.from(10));

    await hatFetcher.getHat(100);
    approvals = await hatFetcher.getHatApprovals(100);
    expect(approvals).toStrictEqual(BigNumber.from(30000));

    await hatFetcher.getHat(10);
    approvals = await hatFetcher.getHatApprovals(10);
    expect(approvals).toStrictEqual(BigNumber.from(20));

    // check that approvals are beeing cached
    mockProvider.clear();
    approvals = await hatFetcher.getHatApprovals(10);
    expect(approvals).toStrictEqual(BigNumber.from(20));
    approvals = await hatFetcher.getHatApprovals(10);
    expect(approvals).toStrictEqual(BigNumber.from(20));
  });
});
