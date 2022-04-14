import AddressesFetcher from './addresses.fetcher';
import { createAddress } from 'forta-agent-tools';


describe("AddressesFetcher test suite", () => {
  const mockAxios = { get: jest.fn() };

  beforeEach(() => mockAxios.get.mockClear());

  it("should return the PIP_ prefixed address", async () => {
    const endpoint = "some-api-endpoint";
    const fetcher: AddressesFetcher = new AddressesFetcher(
      endpoint,
      mockAxios,
      10,
    );

    mockAxios.get.mockReturnValueOnce(new Promise((resolve) => resolve({
        data: {
          No_PIP_data0: createAddress("0xa"),
          PIP_data0: createAddress("0xb"),
          No_PIP_data1: createAddress("0xab"),
          PIP_data1: createAddress("0xc"),
          PIP_data2: createAddress("0xd"),
          PIP_data3: createAddress("0xe"),
        },
      })
    ));

    const addresses: string[] = await fetcher.get(1);
    expect(addresses).toStrictEqual([
      createAddress("0xb"),
      createAddress("0xc"),
      createAddress("0xd"),
      createAddress("0xe"),
    ]);      
    
    expect(mockAxios.get).toBeCalledTimes(1);
    expect(mockAxios.get).toBeCalledWith(endpoint);
  });

  it("should update the addresses", async () => {
    const endpoint = "some-api-endpoint-v2";
    const fetcher: AddressesFetcher = new AddressesFetcher(
      endpoint,
      mockAxios,
      102,
    );

    mockAxios.get.mockReturnValueOnce(new Promise((resolve) => resolve({
        data: {
          PIIP_data0: createAddress("0xa"),
          PIP_data0: createAddress("0xb"),
          No_PIP_data1: createAddress("0xab"),
          PIP_data1: createAddress("0xc"),
          PIP_data2: createAddress("0xd"),
          PIP_data3: createAddress("0xe"),
          OTHER: createAddress('0xdead'),
        },
      })
    ));

    let addresses: string[] = await fetcher.get(1);
    expect(addresses).toStrictEqual([
      createAddress("0xb"),
      createAddress("0xc"),
      createAddress("0xd"),
      createAddress("0xe"),
    ]);     
    
    // no need to update the addresses
    addresses = await fetcher.get(2);
    expect(addresses).toStrictEqual([
      createAddress("0xb"),
      createAddress("0xc"),
      createAddress("0xd"),
      createAddress("0xe"),
    ]);     

    // no need to update the addresses
    addresses = await fetcher.get(20);
    expect(addresses).toStrictEqual([
      createAddress("0xb"),
      createAddress("0xc"),
      createAddress("0xd"),
      createAddress("0xe"),
    ]);    
    
    // time passed, update needed
    mockAxios.get.mockReturnValueOnce(new Promise((resolve) => resolve({
        data: {
          PIP_data3: createAddress("0xe"),
          OTHER: createAddress('0xdead'),
        },
      })
    ));
    addresses = await fetcher.get(103);
    expect(addresses).toStrictEqual([
      createAddress("0xe"),
    ]);     

    expect(mockAxios.get).toBeCalledTimes(2);
    expect(mockAxios.get).nthCalledWith(1, endpoint);
    expect(mockAxios.get).nthCalledWith(2, endpoint);
  });

  it("should return the old addresses on failures", async () => {
    const endpoint = "some-api-endpoint-v3";
    const fetcher: AddressesFetcher = new AddressesFetcher(
      endpoint,
      mockAxios,
      20,
    );

    const log = jest.fn();
    const rejection = (reject: any, error: string) => {
      log(error);
      return reject(error);
    };

    mockAxios.get.mockReturnValueOnce(new Promise((resolve, reject) => rejection(reject, "test-error-occured")));

    // should return empty address du to a failure fetching the addresses the first time
    let addresses: string[] = await fetcher.get(1);
    expect(addresses).toStrictEqual([]);     
    
    // fetching some addresses
    mockAxios.get.mockReturnValueOnce(new Promise((resolve) => resolve({
        data: {
          PIP_data0: createAddress("0x0"),
          PIP_data1: createAddress("0x1"),
        },
      })
    ));

    addresses = await fetcher.get(2);
    expect(addresses).toStrictEqual([
      createAddress("0x0"),
      createAddress("0x1"),
    ]);     
    
    // time passed, update needed
    mockAxios.get.mockReturnValueOnce(new Promise((resolve, reject) => rejection(reject, "test-api-is-shutdown")));
    addresses = await fetcher.get(50);
    // same addresses received
    expect(addresses).toStrictEqual([
      createAddress("0x0"),
      createAddress("0x1"),
    ]);     

    expect(mockAxios.get).toBeCalledTimes(3);
    expect(mockAxios.get).nthCalledWith(1, endpoint);
    expect(mockAxios.get).nthCalledWith(2, endpoint);
    expect(mockAxios.get).nthCalledWith(3, endpoint);

    expect(log).toBeCalledTimes(2);
    expect(log).nthCalledWith(1, "test-error-occured");
    expect(log).nthCalledWith(2, "test-api-is-shutdown");
  });
});