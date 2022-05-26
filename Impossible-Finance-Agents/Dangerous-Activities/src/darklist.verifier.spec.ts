import { createAddress } from "forta-agent-tools/lib/tests";
import DarklistVerifier, { dataUrl } from "./darklist.verifier";

describe("DarklistVerifier tests suite", () => {
  const mockFetcher = jest.fn();
  let verifier: DarklistVerifier;

  const verifyCalls = (numberOfCalls: number) => {
    expect(mockFetcher).toHaveBeenCalledTimes(numberOfCalls);
    for (let i = 1; i <= numberOfCalls; ++i) expect(mockFetcher).nthCalledWith(i, dataUrl);
  };

  const toResponse = (addrs: string[]) => {
    return {
      data: addrs.map((addr) => {
        return {
          address: addr,
        };
      }),
    };
  };

  beforeEach(() => {
    mockFetcher.mockClear();
    verifier = new DarklistVerifier(20, mockFetcher);
  });

  it("should set the threshold correctly", () => {
    for (let i = 1; i <= 20; ++i) {
      const verifier = new DarklistVerifier(i, mockFetcher);
      expect(verifier.threshold).toStrictEqual(i);
    }
  });

  it("should return True only for the addresses in the blacklist", async () => {
    const addresses: string[] = [
      createAddress("0xdead"),
      createAddress("0xfee"),
      createAddress("0xdef1"),
      createAddress("0xe0a"),
      createAddress("0x5eed"),
    ];
    mockFetcher.mockReturnValueOnce(toResponse(addresses));

    for (let i = 1; i <= 20; ++i) expect(await verifier.isDark(createAddress(`0x${i}`))).toStrictEqual(false);
    for (let addr of addresses) expect(await verifier.isDark(addr)).toStrictEqual(true);
    verifyCalls(1);
  });

  it("should update the darklist if the threshold time is passed", async () => {
    const addresses: string[] = [
      createAddress("0xdead"),
      createAddress("0xfee"),
      createAddress("0xdef1"),
      createAddress("0xe0a"),
      createAddress("0x5eed"),
    ];
    mockFetcher.mockReturnValueOnce(toResponse(addresses));

    for (let i = 1; i <= 20; ++i) expect(await verifier.isDark(createAddress(`0x${i}`), i)).toStrictEqual(false);
    for (let addr of addresses) expect(await verifier.isDark(addr, 20)).toStrictEqual(true);

    const extraAddr: string = createAddress("0xbade0a");
    mockFetcher.mockReturnValueOnce(toResponse([...addresses, extraAddr]));

    for (let i = 1; i <= 20; ++i) expect(await verifier.isDark(createAddress(`0x${i}`), i + 20)).toStrictEqual(false);
    for (let addr of addresses) expect(await verifier.isDark(addr, 25)).toStrictEqual(true);
    expect(await verifier.isDark(extraAddr, 40)).toStrictEqual(true);

    verifyCalls(2);
  });
});
