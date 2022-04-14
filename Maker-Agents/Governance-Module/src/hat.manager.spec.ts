import HatManager from "./hat.manager";
import { 
  createAddr, 
  createEncodedAddr, 
} from "./utils";

describe("Hat Manager test suite", () => {
  let hat: string;
  const addr1: string = createAddr("0x1");
  const addr2: string = createAddr("0x2");
  const addr3: string = createAddr("0x3");
  const web3CallMock: any = jest.fn();
  let hatManager: HatManager = new HatManager(web3CallMock, "0x1");

  it("Should fetch the hat always when the block is not cached", async () => {
    // request uncached block
    web3CallMock.mockReturnValueOnce(createEncodedAddr(addr1));
    hat = await hatManager.getAddress(1);
    expect(hat).toStrictEqual(addr1);
    // request cached block
    hat = await hatManager.getAddress(1);
    expect(hat).toStrictEqual(addr1);
    // request uncached block
    web3CallMock.mockReturnValueOnce(createEncodedAddr(addr2))
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(addr2);
    // request uncached block
    web3CallMock.mockReturnValueOnce(createEncodedAddr(addr3))
    hat = await hatManager.getAddress(3);
    expect(hat).toStrictEqual(addr3);
    // request the cached value several times
    hat = await hatManager.getAddress(3);
    expect(hat).toStrictEqual(addr3);
    hat = await hatManager.getAddress(3);
    expect(hat).toStrictEqual(addr3);
    hat = await hatManager.getAddress(3);
    expect(hat).toStrictEqual(addr3);

    expect(web3CallMock).toBeCalledTimes(3);
  });
});
