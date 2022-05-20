const ethers = require('ethers');
const {
  Finding, FindingType, FindingSeverity, createTransactionEvent,
} = require('forta-agent');

const { provideHandleTransaction, provideInitialize } = require('./agent');

// tests
describe('admin event monitoring', () => {
  describe('handleTransaction', () => {
    let initializeData;
    let handleTransaction;

    beforeEach(async () => {
      initializeData = {};

      // initialize the handler
      await (provideInitialize(initializeData))();
      handleTransaction = provideHandleTransaction(initializeData);
    });

    it('returns empty findings if contract address does not match', async () => {
      // logs data for test case:  no address match + no topic match
      const logsNoMatchAddress = [
        {
          address: ethers.constants.AddressZero,
          topics: [
            ethers.constants.HashZero,
          ],
        },
      ];

      // build transaction event
      const txEvent = createTransactionEvent({
        logs: logsNoMatchAddress,
        addresses: { [ethers.constants.AddressZero]: true },
      });

      // run agent
      const findings = await handleTransaction(txEvent);

      // assertions
      expect(findings).toStrictEqual([]);
    });

    it('returns empty findings if contract address matches but not event', async () => {
      const { contracts } = initializeData;

      // retrieve the Object corresponding to the InsuranceFund contract
      let index = 0;
      while (index < contracts.length && contracts[index].name !== 'InsuranceFund') {
        index++;
      }
      const insuranceFundContract = contracts[index];

      // logs data for test case: address match + no topic match
      const logsNoMatchEvent = [
        {
          address: insuranceFundContract.address,
          topics: [
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Paused(address)')),
            ethers.constants.HashZero, // account
          ],
          // create a large dummy array to give ethers.parseLog() something to decode
          data: `0x${'0'.repeat(1000)}`,
        },
      ];

      // build transaction event
      const txEvent = createTransactionEvent({
        logs: logsNoMatchEvent,
        addresses: { [insuranceFundContract.address]: true },
      });

      // run agent
      const findings = await handleTransaction(txEvent);

      // assertions
      expect(findings).toStrictEqual([]);
    });

    it('returns a finding if a target contract emits an event from its watchlist', async () => {
      const { contracts } = initializeData;

      // retrieve the Object corresponding to the InsuranceFund contract
      let index = 0;
      while (index < contracts.length && contracts[index].name !== 'InsuranceFund') {
        index++;
      }
      const insuranceFundContract = contracts[index];

      // logs data for test case: address match + topic match (should trigger a finding)
      const logsMatchEvent = [
        {
          address: insuranceFundContract.address,
          topics: [
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes('OwnershipTransferred(address,address)')),
            ethers.constants.HashZero, // previousOwner
            ethers.constants.HashZero, // newOwner
          ],
          // create a large dummy array to give ethers.parselog() something to decode
          data: `0x${'0'.repeat(1000)}`,
        },
      ];

      // build transaction event
      const txEvent = createTransactionEvent({
        logs: logsMatchEvent,
        addresses: { [insuranceFundContract.address]: true },
      });

      // run agent
      const findings = await handleTransaction(txEvent);

      // create expected finding
      const testFindings = [Finding.fromObject({
        name: 'Perpetual Finance Admin Event',
        description: 'The OwnershipTransferred event was emitted by the InsuranceFund contract',
        alertId: 'AE-PERPFI-ADMIN-EVENT',
        severity: FindingSeverity.High,
        type: FindingType.Suspicious,
        protocol: 'Perp.Fi',
        metadata: {
          contractName: 'InsuranceFund',
          contractAddress: '0x493b4455c6bee3cc9525234605704c7450171591',
          eventName: 'OwnershipTransferred',
          eventArgs: {
            previousOwner: '0x0000000000000000000000000000000000000000',
            newOwner: '0x0000000000000000000000000000000000000000',
          },
        },
      })];

      expect(findings).toStrictEqual(testFindings);
    });
  });
});
