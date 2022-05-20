const axios = require('axios');
const BigNumber = require('bignumber.js');

// mock response from FTX API
const mockFtxResponse = {
  data: {
    success: true,
    result: {
      price: 0,
    },
  },
};

// mock the axios module for FTX API calls
jest.mock('axios');
axios.get.mockResolvedValue(mockFtxResponse);

// mock the ethers module
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Contract: jest.fn(),
}));
const ethers = require('ethers');

const WEI_PER_ETHER = new BigNumber(ethers.constants.WeiPerEther.toString());

const {
  createAlert,
  provideHandleBlock,
  provideInitialize,
} = require('./agent');

/* mock axios test */
describe('mock axios GET request', () => {
  it('should call axios.get and return a response', async () => {
    mockFtxResponse.data.result.price = 42;
    const response = await axios.get('https://...');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(response.data.result.price).toEqual(42);
  });
});

/* agent tests */
describe('price spread ratio monitoring', () => {
  let initialize;
  let handleBlock;
  let data;
  let blockEvent;

  // for the tests, we will keep the mocked FTX API price constant and change the mocked price
  // returned by the perpetual finance contract
  const mockFtxPrice = 100;
  const upperLimitPercent = 1;
  const lowerLimitPercent = -1;
  const mockContractName = 'FAKE1';
  const mockContractAddress = '0xFAKEADDRESS1';

  beforeEach(async () => {
    axios.get.mockClear();

    // reset the price returned by the mocked FTX API
    mockFtxResponse.data.result.price = mockFtxPrice;

    data = {};

    initialize = provideInitialize(data);
    await initialize();

    // initialize the data structure
    data.provider = {};
    data.contractNames = [
      mockContractName,
    ];
    data.contractsData = [{
      name: mockContractName,
      address: mockContractAddress,
      timeThresholdSeconds: BigInt(100),
    }];

    // set up the upper and lower limits to make the price spread ratio acceptable
    data.contractsData[0].upperLimitPercent = new BigNumber(upperLimitPercent);
    data.contractsData[0].lowerLimitPercent = new BigNumber(lowerLimitPercent);

    // create the handler
    handleBlock = provideHandleBlock(data);

    // create a block event that will initialize the timestamp on the contract data object
    blockEvent = {
      block: {
        timestamp: 1,
      },
    };
  });

  describe('handleBlock', () => {
    it('returns empty findings if the price spread ratio is within the limits', async () => {
      // set up prices that will not trigger an alert
      const mockPerpPrice = new BigNumber(101);
      const mockPerpPriceWei = mockPerpPrice.times(WEI_PER_ETHER);

      // set up the mock contract methods to return the price information
      data.contractsData[0].contract = {
        getIndexPrice: jest.fn().mockResolvedValue(mockPerpPriceWei),
      };

      // run the handler
      let findings = await handleBlock(blockEvent);

      // check assertions
      expect(findings).toStrictEqual([]);

      // intentionally set the next timestamp to be beyond the time threshold
      blockEvent.block.timestamp += (1 + Number(data.contractsData[0].timeThresholdSeconds));

      // run the handler again
      findings = await handleBlock(blockEvent);

      // check assertions
      // axios.get will not be called for the first run of the handler
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(findings).toStrictEqual([]);
    });

    it('returns empty findings if the price spread ratio is beyond the threshold but not enough time has elapsed', async () => {
      // set up prices that will trigger an alert
      const mockPerpPrice = new BigNumber(102);
      const mockPerpPriceWei = mockPerpPrice.times(WEI_PER_ETHER);

      // set up the mock contract methods to return the price information
      data.contractsData[0].contract = {
        getIndexPrice: jest.fn().mockResolvedValue(mockPerpPriceWei),
      };

      // run the handler
      let findings = await handleBlock(blockEvent);

      // check assertions
      expect(findings).toStrictEqual([]);

      // intentionally set the next timestamp to be within the time threshold
      blockEvent.block.timestamp += (Number(data.contractsData[0].timeThresholdSeconds) - 1);

      // run the handler again
      findings = await handleBlock(blockEvent);

      // check assertions
      // axios.get will not be called for the first run of the handler
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(findings).toStrictEqual([]);
    });

    it('returns findings if the price spread ratio is too high', async () => {
      // set up prices that will trigger an alert
      const mockPerpPrice = new BigNumber(102);
      const mockPerpPriceWei = mockPerpPrice.times(WEI_PER_ETHER);

      // set up the mock contract methods to return the price information
      data.contractsData[0].contract = {
        getIndexPrice: jest.fn().mockResolvedValue(mockPerpPriceWei),
      };

      // run the handler
      let findings = await handleBlock(blockEvent);

      // check assertions
      expect(findings).toStrictEqual([]);

      // intentionally set the next timestamp to be beyond the time threshold
      blockEvent.block.timestamp += (1 + Number(data.contractsData[0].timeThresholdSeconds));

      // run the handler again
      findings = await handleBlock(blockEvent);

      // manually calculate the price spread ratio
      const mockFtxPriceWei = (new BigNumber(mockFtxPrice)).times(WEI_PER_ETHER);
      const priceSpreadRatio = (mockPerpPriceWei.minus(mockFtxPriceWei)).dividedBy(mockFtxPriceWei);

      // create expected finding to compare to handler result
      const expectedFinding = createAlert(
        mockContractName,
        mockContractAddress,
        priceSpreadRatio,
        data.contractsData[0].upperLimitPercent,
        data.contractsData[0].lowerLimitPercent,
        data.contractsData[0].timeThresholdSeconds,
        BigInt(101),
      );

      // check assertions
      // axios.get will not be called for the first run of the handler
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(findings).toStrictEqual([expectedFinding]);
    });

    it('returns findings if the price spread ratio is too low', async () => {
      // set up prices that will trigger an alert
      const mockPerpPrice = new BigNumber(98);
      const mockPerpPriceWei = mockPerpPrice.times(WEI_PER_ETHER);

      // set up the mock contract methods to return the price information
      data.contractsData[0].contract = {
        getIndexPrice: jest.fn().mockResolvedValue(mockPerpPriceWei),
      };

      // run the handler
      let findings = await handleBlock(blockEvent);

      // check assertions
      expect(findings).toStrictEqual([]);

      // intentionally set the next timestamp to be beyond the time threshold
      blockEvent.block.timestamp += (1 + Number(data.contractsData[0].timeThresholdSeconds));

      // run the handler again
      findings = await handleBlock(blockEvent);

      // manually calculate the price spread ratio
      const mockFtxPriceWei = (new BigNumber(mockFtxPrice)).times(WEI_PER_ETHER);
      const priceSpreadRatio = (mockPerpPriceWei.minus(mockFtxPriceWei)).dividedBy(mockFtxPriceWei);

      // create expected finding to compare to handler result
      const expectedFinding = createAlert(
        mockContractName,
        mockContractAddress,
        priceSpreadRatio,
        data.contractsData[0].upperLimitPercent,
        data.contractsData[0].lowerLimitPercent,
        data.contractsData[0].timeThresholdSeconds,
        BigInt(101),
      );

      // check assertions
      // axios.get will not be called for the first run of the handler
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(findings).toStrictEqual([expectedFinding]);
    });
  });
});
