const ethers = require('ethers');
const BigNumber = require('bignumber.js');
const {
  Finding, FindingSeverity, FindingType,
} = require('forta-agent');
const { provideInitialize, provideHandleBlock } = require('./agent');

const data = {};

const TEST_ADDRESS = ethers.constants.AddressZero;

// mock the usdc contract
const mockUsdcContract = {
  balanceOf: jest.fn(),
};

describe('USDC balance change', () => {
  let handleBlock;

  beforeEach(async () => {
    // set up handler
    await (provideInitialize(data))();

    handleBlock = provideHandleBlock(data);

    // assign values for testing
    data.blockWindow = 4;
    data.changeThresholdPercent = 10;

    // reset the addresses object
    // use a single address for testing
    data.addresses = {
      [TEST_ADDRESS]: {
        name: 'Test',
        balanceHistory: [],
      },
    };

    mockUsdcContract.balanceOf.mockReset();
    data.usdcContract = mockUsdcContract;
  });

  // convenience function to iterate over several blocks to build up balance history
  // while expecting no findings
  async function iterateHandlerExpectEmpty(iterations) {
    for (let i = 0; i < iterations; i++) {
      // these iterations need to happen synchronously to ensure the ordering is correct
      // eslint-disable-next-line no-await-in-loop
      const findings = await handleBlock();
      expect(findings).toStrictEqual([]);
    }
  }

  describe('does not report', () => {
    it('when the balances do not change', async () => {
      // simulate a constant balance - 4 USDC
      mockUsdcContract.balanceOf.mockResolvedValue(ethers.BigNumber.from(4000000));

      // get N balance updates (N=blockWindow)
      await iterateHandlerExpectEmpty(data.blockWindow);

      // the next block event will give us N+1 balances --> will trigger a balance check
      const findings = await handleBlock();

      // there should be no findings
      expect(findings).toStrictEqual([]);

      // do some additional checks on the balance history
      const { balanceHistory } = data.addresses[TEST_ADDRESS];

      // the current balance should match the last call to balanceOf()
      expect(balanceHistory.slice(-1)[0]).toStrictEqual(new BigNumber(4000000));

      // there should be 1 less balance recorded for each address at this point
      // (the oldest was shifted out of the balance array for the next cycle)
      expect(balanceHistory.length).toStrictEqual(data.blockWindow);
    });

    it('when all balance changes are below the threshold', async () => {
      // simulate a changing balance under the threshold
      // 5.4, 5.3, 5.2, 5.1, 5.0 USDC
      mockUsdcContract.balanceOf = jest.fn()
        .mockResolvedValueOnce(ethers.BigNumber.from(5400000))
        .mockResolvedValueOnce(ethers.BigNumber.from(5300000))
        .mockResolvedValueOnce(ethers.BigNumber.from(5200000))
        .mockResolvedValueOnce(ethers.BigNumber.from(5100000))
        .mockResolvedValueOnce(ethers.BigNumber.from(5000000));

      // get N balance updates (N=blockWindow)
      await iterateHandlerExpectEmpty(data.blockWindow);

      // the next block event will give us N+1 balances --> will trigger a balance check
      const findings = await handleBlock();

      // there should be no findings
      expect(findings).toStrictEqual([]);

      // do some additional checks on the balance history
      const { balanceHistory } = data.addresses[TEST_ADDRESS];

      // the current balance should match the last call to balanceOf()
      expect(balanceHistory.slice(-1)[0]).toStrictEqual(new BigNumber(5000000));

      // there should be 1 less balance recorded for each address at this point
      // (the oldest was shifted out of the balance array for the next cycle)
      expect(balanceHistory.length).toStrictEqual(data.blockWindow);
    });

    it('when the balance change is above the threshold but outside the block window', async () => {
      // simulate a changing balance over the threshold, but too slow to trigger
      // within the block window
      // 6.7, 6.6, 6.5, 6.4, 6.3, 6.2, 6.1, 6.0 USDC
      mockUsdcContract.balanceOf = jest.fn()
        .mockResolvedValueOnce(ethers.BigNumber.from(6700000))
        .mockResolvedValueOnce(ethers.BigNumber.from(6600000))
        .mockResolvedValueOnce(ethers.BigNumber.from(6500000))
        .mockResolvedValueOnce(ethers.BigNumber.from(6400000))
        .mockResolvedValueOnce(ethers.BigNumber.from(6300000))
        .mockResolvedValueOnce(ethers.BigNumber.from(6200000))
        .mockResolvedValueOnce(ethers.BigNumber.from(6100000))
        .mockResolvedValueOnce(ethers.BigNumber.from(6000000));

      // get 8 balance updates
      // there should be no findings
      await iterateHandlerExpectEmpty(8);

      // do some additional checks on the balance history
      const { balanceHistory } = data.addresses[TEST_ADDRESS];

      // the current balance should match the last call to balanceOf()
      expect(balanceHistory.slice(-1)[0]).toStrictEqual(new BigNumber(6000000));

      // there should be 1 less balance recorded for each address at this point
      // (the oldest was shifted out of the balance array for the next cycle)
      expect(balanceHistory.length).toStrictEqual(data.blockWindow);
    });

    it('when a positive balance change is above the threshold and within the block window', async () => {
      // simulate an increasing balance over the threshold
      // 3.0, 3.1, 3.2, 3.3, 3.6 USDC
      mockUsdcContract.balanceOf = jest.fn()
        .mockResolvedValueOnce(ethers.BigNumber.from(3000000))
        .mockResolvedValueOnce(ethers.BigNumber.from(3100000))
        .mockResolvedValueOnce(ethers.BigNumber.from(3200000))
        .mockResolvedValueOnce(ethers.BigNumber.from(3300000))
        .mockResolvedValueOnce(ethers.BigNumber.from(3600000));

      // get N balance updates (N=blockWindow)
      await iterateHandlerExpectEmpty(data.blockWindow);

      // the next block event will give us N+1 balances --> will trigger a balance check
      const findings = await handleBlock();

      // check findings
      expect(findings).toStrictEqual([]);

      // do some additional checks on the balance history
      const { balanceHistory } = data.addresses[TEST_ADDRESS];

      // the current balance should match the last call to balanceOf()
      expect(balanceHistory.slice(-1)[0]).toStrictEqual(new BigNumber(3600000));

      // there should be 1 less balance recorded for each address at this point
      // (the oldest was shifted out of the balance array for the next cycle)
      expect(balanceHistory.length).toStrictEqual(data.blockWindow);
    });
  });

  describe('reports', () => {
    it('when a negative balance change is above the threshold and within the block window', async () => {
      // simulate a decreasing balance over the threshold
      // 2.8, 2.7, 2.5, 2.3, 2.1 USDC
      mockUsdcContract.balanceOf = jest.fn()
        .mockResolvedValueOnce(ethers.BigNumber.from(2800000))
        .mockResolvedValueOnce(ethers.BigNumber.from(2700000))
        .mockResolvedValueOnce(ethers.BigNumber.from(2500000))
        .mockResolvedValueOnce(ethers.BigNumber.from(2300000))
        .mockResolvedValueOnce(ethers.BigNumber.from(2100000));

      // get N balance updates (N=blockWindow)
      await iterateHandlerExpectEmpty(data.blockWindow);

      // the next block event will give us N+1 balances --> will trigger a balance check
      const findings = await handleBlock();

      // check findings
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Perp.Fi USDC Balance Change',
          description: 'The USDC balance of the Test account changed by -25% in the past 4 blocks',
          alertId: 'AE-PERPFI-USDC-BALANCE-CHANGE',
          protocol: 'Perp.Fi',
          severity: FindingSeverity.Critical,
          type: FindingType.Suspicious,
          metadata: {
            address: TEST_ADDRESS,
            balance: '2100000',
            pctChange: '-25',
          },
        }),
      ]);

      // do some additional checks on the balance history
      const { balanceHistory } = data.addresses[TEST_ADDRESS];

      // the current balance should match the last call to balanceOf()
      expect(balanceHistory.slice(-1)[0]).toStrictEqual(new BigNumber(2100000));

      // there should be 1 less balance recorded for each address at this point
      // (the oldest was shifted out of the balance array for the next cycle)
      expect(balanceHistory.length).toStrictEqual(data.blockWindow);
    });
  });
});
