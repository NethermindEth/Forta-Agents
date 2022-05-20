const { provideInitialize, provideHandleTransaction, createAlert } = require('./agent');

const data = {};

// addressA is the address we are monitoring, addressB is arbitrary
const addressA = `0x${'A'.repeat(40)}`;
const addressB = `0x${'B'.repeat(40)}`;

// converts an integer into a 256 bit hex string
function toHash(num) {
  return `0x${num.toString(16).padStart(64, 0)}`;
}

describe('failed transactions', () => {
  let handleTransaction;
  let txObject;
  let hash;
  const mockGetTransactionReceipt = jest.fn()

  beforeEach(async () => {
    // reset hash
    hash = 0;

    // set up handler
    await (provideInitialize(data))();
    const handler = provideHandleTransaction(data, mockGetTransactionReceipt);
    handleTransaction = async (txEvent) => {
      // wrapper to increment hash along the way
      txObject.hash = toHash(hash++);
      return handler(txEvent);
    };

    // assign values for testing
    data.addresses = { A: addressA };
    data.failedTxs = { A: {} };
    data.blockWindow = 5;
    data.failedTxLimit = 10;

    // default status, txObject, hash automatically incremented
    mockGetTransactionReceipt.mockReturnValue({ status: false })

    txObject = {
      from: addressA,
      blockNumber: 10,
    };
  });

  async function iterateHandlerExpectEmpty(iterations) {
    for (let i = 0; i < iterations; i++) {
      // our handleTransaction wrapper needs to be awaited in the loop because the hash
      // incrementer needs to be synchronous to ensure the ordering of txHashes
      // eslint-disable-next-line no-await-in-loop
      const findings = await handleTransaction(txObject);
      expect(findings).toStrictEqual([]);
    }
  }

  describe('does not report', () => {
    it('when there are no failed txs', async () => {
      // add 15 non failed transactions in the same block
      mockGetTransactionReceipt.mockReturnValue({ status: true })
      await iterateHandlerExpectEmpty(15);
    });

    it('when there are failed txs but on the wrong address', async () => {
      // add 15 failed transactions in the same block but on the wrong address
      txObject.from = addressB;
      await iterateHandlerExpectEmpty(15);
    });

    it('when there are failed txs on the right addresses but not over the limit', async () => {
      // add 9 failed transactions in the same block on the right address
      await iterateHandlerExpectEmpty(9);

      // increase block number past block window and send 9 more failed transactions
      txObject.blockNumber += data.blockWindow + 1;
      await iterateHandlerExpectEmpty(9);
    });
  });

  describe('reports', () => {
    it('when there are more failed txs than the limit', async () => {
      // add 9 failed transactions
      await iterateHandlerExpectEmpty(9);

      // add the 10th failed transaction
      const finding = await handleTransaction(txObject);

      // generate expected failure
      const failedTxs = [...Array(10).keys()].map((num) => toHash(num));
      const expectedFinding = [createAlert('A', addressA, failedTxs, data.blockWindow)];

      // check for expected failure
      expect(finding).toStrictEqual(expectedFinding);
    });

    it('only failed txs within the block window', async () => {
      // add 9 failed transactions
      await iterateHandlerExpectEmpty(9);

      // increase block number past block window and send 9 more failed transactions
      txObject.blockNumber += data.blockWindow + 1;
      await iterateHandlerExpectEmpty(9);

      // add the 10th failed transaction
      const finding = await handleTransaction(txObject);

      // generate expected failure
      const failedTxs = [...Array(10).keys()].map((num) => toHash(num + 9));
      const expectedFinding = [createAlert('A', addressA, failedTxs, data.blockWindow)];

      // check for expected failure
      expect(finding).toStrictEqual(expectedFinding);
    });
  });
});
