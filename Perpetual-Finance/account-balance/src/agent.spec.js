const { createBlockEvent } = require('forta-agent');

const { createAlert, provideHandleBlock, provideInitialize } = require('./agent');

const { accountBalance } = require('./agent-config.json');

const ALERT_MINIMUM_INTERVAL_SECONDS = accountBalance.alertMinimumIntervalSeconds;

// Tests
describe('account balance monitoring', () => {
  describe('handleBlock', () => {
    let initializeData;
    let handleBlock;

    const mockThresholds = {
      Maker: 3,
      Arbitrageur: 3,
      CancelOrderKeeper: 3,
      Liquidator: 3,
    };

    const mockAddresses = {
      Maker: '0xMAKERADDRESS',
      Arbitrageur: '0xARBITRAGEURADDRESS',
      CancelOrderKeeper: '0xCANCELORDERKEEPERADDRESS',
      Liquidator: '0xLIQUIDATORADDRESS',
    };

    beforeEach(async () => {
      initializeData = {};

      // Initialize the Handler
      await (provideInitialize(initializeData))();

      // update each account's address and threshold to use the mocked address and mocked threshold
      initializeData.accounts.forEach((account) => {
        /* eslint-disable no-param-reassign */
        account.accountAddress = mockAddresses[account.accountName];
        account.accountThresholds = mockThresholds[account.accountName];
        /* eslint-enable no-param-reassign */
      });

      handleBlock = provideHandleBlock(initializeData);
    });

    it('Test when all account balances are greater than the threshold', async () => {
      // mock the provider to return values greater than threshold
      const mockProvider = {
        getBalance: jest.fn(() => Promise.resolve(4000000000000000000)),
      };

      initializeData.provider = mockProvider;

      const blockEvent = createBlockEvent({
        blockNumber: 12345,
        block: {
          timestamp: 1234567890,
        },
      });

      // Run agent
      const findings = await handleBlock(blockEvent);

      // Assertions
      expect(findings).toStrictEqual([]);
    });

    it('Test when all account balances are less than the threshold', async () => {
      // mock the provider to return values less than threshold
      const mockProvider = {
        getBalance: jest.fn(() => Promise.resolve(4)),
      };

      initializeData.provider = mockProvider;

      // Build Block Event
      const blockEvent = createBlockEvent({
        blockNumber: 12345,
        block: {
          timestamp: 1234567890,
        },
      });

      // Run agent
      const findings = await handleBlock(blockEvent);

      // Assertions
      const alerts = [
        createAlert('Maker', '0xMAKERADDRESS', 4, mockThresholds.Maker, 0),
        createAlert('Arbitrageur', '0xARBITRAGEURADDRESS', 4, mockThresholds.Arbitrageur, 0),
        createAlert('CancelOrderKeeper', '0xCANCELORDERKEEPERADDRESS', 4, mockThresholds.CancelOrderKeeper, 0),
        createAlert('Liquidator', '0xLIQUIDATORADDRESS', 4, mockThresholds.Liquidator, 0),
      ];

      expect(findings).toStrictEqual(alerts);
    });

    it('Test when only maker account balance is less than the threshold', async () => {
      // mock the provider to return values less than threshold if this is the maker account
      const mockProvider = {
        getBalance: jest.fn((accountAddress) => {
          // If this is the maker account, return 2900000000000000000 so it fires an alert
          if (accountAddress === '0xMAKERADDRESS') {
            return Promise.resolve(2900000000000000000);
          }
          return Promise.resolve(4000000000000000000);
        }),
      };

      initializeData.provider = mockProvider;

      // Build Block Event
      const blockEvent = createBlockEvent({
        blockNumber: 12345,
        block: {
          timestamp: 1234567890,
        },
      });

      // Run agent
      const findings = await handleBlock(blockEvent);

      // Assertions
      const alerts = [
        createAlert('Maker', '0xMAKERADDRESS', 2900000000000000000, mockThresholds.Maker, 0),
      ];

      expect(findings).toStrictEqual(alerts);
    });

    it('Test returns no findings if last alert was created less than N hours ago', async () => {
      // mock the provider to return values less than threshold
      const mockProvider = {
        getBalance: jest.fn(() => Promise.resolve(4)),
      };

      initializeData.provider = mockProvider;

      // create a timestamp
      const blockTimestamp = 1234567890;

      // create a timestamp for when the last alert was triggered, less than N hours ago
      const mockedTime = blockTimestamp - ALERT_MINIMUM_INTERVAL_SECONDS + 1;

      // build Block Event
      const blockEvent = createBlockEvent({
        blockNumber: 12345,
        block: {
          timestamp: blockTimestamp,
        },
      });

      // update the start time for each account in the initialized data
      initializeData.accounts.forEach((account) => {
        // eslint-disable-next-line no-param-reassign
        account.startTime = mockedTime;
      });

      // run agent
      const findings = await handleBlock(blockEvent);

      // assertions
      expect(findings).toStrictEqual([]);
    });

    it('Test returns findings if last alert was created greater than N hours ago', async () => {
      // mock the provider to return values less than threshold
      const mockProvider = {
        getBalance: jest.fn(() => Promise.resolve(4)),
      };

      initializeData.provider = mockProvider;

      // create a timestamp
      const blockTimestamp = 1234567890;

      // create a timestamp for when the last alert was triggered, greater than N hours ago
      const mockedTime = blockTimestamp - ALERT_MINIMUM_INTERVAL_SECONDS - 1;

      // build Block Event
      const blockEvent = createBlockEvent({
        blockNumber: 12345,
        block: {
          timestamp: blockTimestamp,
        },
      });

      // update the start time for each account in the initialized data
      initializeData.accounts.forEach((account) => {
        // eslint-disable-next-line no-param-reassign
        account.startTime = mockedTime;
      });

      // run agent
      const findings = await handleBlock(blockEvent);

      // assertions
      const alerts = [
        createAlert('Maker', '0xMAKERADDRESS', 4, mockThresholds.Maker, 0),
        createAlert('Arbitrageur', '0xARBITRAGEURADDRESS', 4, mockThresholds.Arbitrageur, 0),
        createAlert('CancelOrderKeeper', '0xCANCELORDERKEEPERADDRESS', 4, mockThresholds.CancelOrderKeeper, 0),
        createAlert('Liquidator', '0xLIQUIDATORADDRESS', 4, mockThresholds.Liquidator, 0),
      ];

      expect(findings).toStrictEqual(alerts);
    });

    it('Test returns findings and number of alerts since last finding is 2 when the previous 2 alerts were created less than N hours ago', async () => {
      // mock the provider to return values less than threshold
      const mockProvider = {
        getBalance: jest.fn(() => Promise.resolve(4)),
      };

      initializeData.provider = mockProvider;

      // create a timestamp and block number
      let blockTimestamp = 1234567890;
      let blockNumber = 12345;

      // create a timestamp for when the last alert was triggered, less than N hours ago
      const mockedTime = blockTimestamp - 1;

      // build Block Event
      let blockEvent = createBlockEvent({
        blockNumber,
        block: {
          timestamp: blockTimestamp,
        },
      });

      // update the start time for each account in the initialized data
      initializeData.accounts.forEach((account) => {
        // eslint-disable-next-line no-param-reassign
        account.startTime = mockedTime;
      });

      // run agent
      let findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);

      // create a new block but have the timestamp be within N hours
      blockNumber += 1;
      blockTimestamp += 20;

      blockEvent = createBlockEvent({
        blockNumber,
        block: {
          timestamp: blockTimestamp,
        },
      });

      // run agent again
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);

      // create the last new block but have the timestamp be greater than N hours
      blockNumber += 1;
      blockTimestamp += ALERT_MINIMUM_INTERVAL_SECONDS;

      blockEvent = createBlockEvent({
        blockNumber,
        block: {
          timestamp: blockTimestamp,
        },
      });

      findings = await handleBlock(blockEvent);

      // assertions
      const alerts = [
        createAlert('Maker', '0xMAKERADDRESS', 4, mockThresholds.Maker, 2),
        createAlert('Arbitrageur', '0xARBITRAGEURADDRESS', 4, mockThresholds.Arbitrageur, 2),
        createAlert('CancelOrderKeeper', '0xCANCELORDERKEEPERADDRESS', 4, mockThresholds.CancelOrderKeeper, 2),
        createAlert('Liquidator', '0xLIQUIDATORADDRESS', 4, mockThresholds.Liquidator, 2),
      ];

      expect(findings).toStrictEqual(alerts);
    });

    it('Test returns findings and number of alerts since last finding gets reset back to 0 after alert is generated', async () => {
      // mock the provider to return values less than threshold
      const mockProvider = {
        getBalance: jest.fn(() => Promise.resolve(4)),
      };

      initializeData.provider = mockProvider;

      // build Block Event
      const blockEvent = createBlockEvent({
        blockNumber: 12345,
        block: {
          timestamp: 1234567890,
        },
      });

      // artificially set the number of alerts since last finding to 2
      initializeData.accounts.forEach((account) => {
        // eslint-disable-next-line no-param-reassign
        account.numAlertsSinceLastFinding = 2;
      });

      // run agent
      const findings = await handleBlock(blockEvent);

      // assertions
      const alerts = [
        createAlert('Maker', '0xMAKERADDRESS', 4, mockThresholds.Maker, 2),
        createAlert('Arbitrageur', '0xARBITRAGEURADDRESS', 4, mockThresholds.Arbitrageur, 2),
        createAlert('CancelOrderKeeper', '0xCANCELORDERKEEPERADDRESS', 4, mockThresholds.CancelOrderKeeper, 2),
        createAlert('Liquidator', '0xLIQUIDATORADDRESS', 4, mockThresholds.Liquidator, 2),
      ];

      expect(findings).toStrictEqual(alerts);

      // iterate through each account and make sure number of alerts since last finding has been
      // reset to 0
      initializeData.accounts.forEach((account) => {
        expect(account.numAlertsSinceLastFinding).toStrictEqual(0);
      });
    });
  });
});
