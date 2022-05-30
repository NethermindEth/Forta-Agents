import { BigNumber, BigNumberish } from "ethers";
import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import utils from "./utils";

const TEST_ADDRESSES = [createAddress("0x1abc"), createAddress("0x2def"), createAddress("0xdead")];

const createFinding = (addrs: string[], gas: string, threshold: BigNumber) => {
  const gasStr: string = BigNumber.from(gas).toString();

  return Finding.fromObject({
    name: "High Gas Usage Detection",
    description: `High gas is used - above ${threshold.toString()} Gwei`,
    alertId: "IMPOSSIBLE-2",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      protocolContracts: addrs.toString(),
      gasInGwei: gasStr.slice(0, gasStr.length - 9),
      gasInWei: gasStr,
    },
  });
};

describe("Gas monitor bot test suite", () => {
  const threshold: BigNumber = BigNumber.from(20);
  const handleTransaction: HandleTransaction = provideHandleTransaction(utils.isOnList(TEST_ADDRESSES), threshold);

  const toGas = (wei: BigNumberish) => BigNumber.from(wei).mul(BigNumber.from(10).pow(9));

  it("should return empty finding", async () => {
    const tx = new TestTransactionEvent();
    tx.setGasPrice(toGas(200).toHexString());

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding if gas is below or equals to threshold", async () => {
    const CASES: number[] = [12, 8, 2, 19, 11, 20];

    for (let price of CASES) {
      const tx = new TestTransactionEvent().addInvolvedAddresses(...TEST_ADDRESSES);

      tx.setGasPrice(toGas(price).toHexString());
      const findings = await handleTransaction(tx);

      expect(findings).toStrictEqual([]);
    }
  });

  it("should return a finding if gas is above threshold", async () => {
    const CASES: number[] = [21, 100, 234, 22, 30, 42];

    for (let price of CASES) {
      const tx = new TestTransactionEvent().addInvolvedAddresses(...TEST_ADDRESSES);
      tx.setGasPrice(toGas(price).toHexString());

      const findings = await handleTransaction(tx);

      expect(findings).toStrictEqual([createFinding(TEST_ADDRESSES, tx.transaction.gasPrice, threshold)]);
    }
  });

  it("should return empty finding if non relevant addresses are involved", async () => {
    const tx = new TestTransactionEvent().addInvolvedAddresses(createAddress("0x6"), createAddress("0xfee"));
    tx.setGasPrice(toGas(10000).toHexString());

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if gas used is above the threshold for one Gwei", async () => {
    const tx = new TestTransactionEvent().addInvolvedAddresses(TEST_ADDRESSES[2], TEST_ADDRESSES[1]);
    tx.setGasPrice(toGas(toGas(threshold).add(1).toHexString()).toHexString()); // 11 GWei

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding([TEST_ADDRESSES[2], TEST_ADDRESSES[1]], tx.transaction.gasPrice, threshold),
    ]);
  });
});
