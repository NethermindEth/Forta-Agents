import HatManager from "./hat.manager";
import { 
  createAddr, 
  createEncodedAddr, 
  propertyFetcher, 
  PropertyFetcher, 
} from "./utils";

describe("Hat Manager test suite", () => {
  let hat: string;
  const dead: string = createAddr("0xdead");
  const web3CallMock: any = jest.fn(
    (calldata: any, block:number) => calldata.data,
  );
  // fetcher always return 0xdead address
  const fetcher: PropertyFetcher = propertyFetcher(
    web3CallMock, 
    "", 
    () => createEncodedAddr(dead), 
    'address',
  )
  let hatManager: HatManager;

  beforeEach(() => {
    hatManager = new HatManager(fetcher);
    web3CallMock.mockClear();
  });

  it("Should fetch the hat always when the block is not setted", async () => {
    // request unstored blocks
    hat = await hatManager.getAddress(1);
    expect(hat).toStrictEqual(dead);
    hat = await hatManager.getAddress(1);
    expect(hat).toStrictEqual(dead);
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(dead);
    hat = await hatManager.getAddress(20);
    expect(hat).toStrictEqual(dead);

    expect(web3CallMock).toBeCalledTimes(4);
  });

  it("Should not fetch if the requested block is stored", async () => {
    const testAddr: string = createAddr("0x1");
    hatManager.setAddress(testAddr).setBlock(2);
    
    // request the stored block
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(testAddr);
    // request an unstored block
    hat = await hatManager.getAddress(1);
    expect(hat).toStrictEqual(dead);
    // request the stored block
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(testAddr);
    // request an unstored block
    hat = await hatManager.getAddress(20);
    expect(hat).toStrictEqual(dead);

    expect(web3CallMock).toBeCalledTimes(2);
  });

  it("Should change the block", async () => {
    const testAddr: string = createAddr("0x1");
    hatManager.setAddress(testAddr).setBlock(2);
    
    // request the stored block
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(testAddr);
    
    // change the block
    hatManager.setBlock(3);

    // request previously stored block
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(dead);

    // request new stored block
    hat = await hatManager.getAddress(3);
    expect(hat).toStrictEqual(testAddr);

    // request an unestored block
    hat = await hatManager.getAddress(20);
    expect(hat).toStrictEqual(dead);

    expect(web3CallMock).toBeCalledTimes(2);
  });

  it("Should change the address", async () => {
    const testAddr1: string = createAddr("0x1");
    const testAddr2: string = createAddr("0x2");
    hatManager.setAddress(testAddr1).setBlock(2);
    
    // request the stored block
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(testAddr1);

    // change the address
    hatManager.setAddress(testAddr2);
    
    // request the stored block
    hat = await hatManager.getAddress(2);
    expect(hat).toStrictEqual(testAddr2);

    expect(web3CallMock).toBeCalledTimes(0);
  });
});
