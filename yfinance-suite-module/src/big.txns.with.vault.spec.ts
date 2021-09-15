import { HandleTransaction, TransactionEvent, Finding, FindingType, FindingSeverity } from "forta-agent";
import { TestTransactionEvent, createAddress } from "general-agents-module";
import Web3 from "web3";
import provideBigTransactionsAgent from "./big.txns.with.vault";
import { toWei, encodeParameter } from "./test.utils";

const TEST_VAULT_ADDR = createAddress("0x121212");
const TEST_VAULT_UNDERLYING_TOKEN = createAddress("0x131313");
const TOKEN_FUNC_SELECTOR = "0xfc0c546a";

const generateFinding = (isFrom: boolean, threshold: string): Finding => {
  const stringDirection = isFrom ? "from" : "into";
  return Finding.fromObject({
    name: "Big transaction related with Yearn Vault",
    alertId: "TEST",
    description: `An amount greater than ${threshold} of underlaying was moved ${stringDirection} Yearn Vault`,
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    metadata: {
      YearnVault: TEST_VAULT_ADDR,
    },
  });
};

const createWeb3Mock = (): Web3 => {
  const mockWeb3: Web3 = new Web3();
  mockWeb3.eth.call = async ({ to, data }: { to: string; data: string }): Promise<string> => {
    switch (to) {
      case TEST_VAULT_ADDR:
        const selector: string = data.slice(0, 10);
        switch (selector) {
          case TOKEN_FUNC_SELECTOR:
            return mockWeb3.eth.abi.encodeParameter("address", TEST_VAULT_UNDERLYING_TOKEN);

          default:
            return "";
        }

      default:
        return "";
    }
  };
  return mockWeb3;
};

describe("Yearn Vault Big Transactions", () => {
  let handleTransaction: HandleTransaction, mockWeb3: Web3;

  beforeAll(() => {
    mockWeb3 = createWeb3Mock();
  });

  it("should returns empty findings if no event is emmited", async () => {
    handleTransaction = provideBigTransactionsAgent(mockWeb3, "TEST", TEST_VAULT_ADDR, toWei("10"));

    const txEvent: TransactionEvent = new TestTransactionEvent();

    const finding: Finding[] = await handleTransaction(txEvent);

    expect(finding).toStrictEqual([]);
  });

  it("should returns empty findings if the ERC20 event is not from the underlying asset", async () => {
    handleTransaction = provideBigTransactionsAgent(mockWeb3, "TEST", TEST_VAULT_ADDR, toWei("10"));

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "Transfer(address,address,uint256)",
      createAddress("0x141414"),
      [encodeParameter("address", createAddress("0x0")), encodeParameter("address", TEST_VAULT_ADDR)],
      encodeParameter("uint256", toWei("11")),
    );

    const finding: Finding[] = await handleTransaction(txEvent);

    expect(finding).toStrictEqual([]);
  });

  it("should returns empy findings if the ERC20 trasnfer is not related with the Vault", async () => {
    handleTransaction = provideBigTransactionsAgent(mockWeb3, "TEST", TEST_VAULT_ADDR, toWei("10"));

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "Transfer(address,address,uint256)",
      TEST_VAULT_UNDERLYING_TOKEN,
      [encodeParameter("address", createAddress("0x0")), encodeParameter("address", createAddress("0x141414"))],
      encodeParameter("uint256", toWei("11")),
    );

    const finding: Finding[] = await handleTransaction(txEvent);

    expect(finding).toStrictEqual([]);
  });

  it("should returns a finding if the ERC20 transfer is going into the Vault", async () => {
    handleTransaction = provideBigTransactionsAgent(mockWeb3, "TEST", TEST_VAULT_ADDR, toWei("10"));

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "Transfer(address,address,uint256)",
      TEST_VAULT_UNDERLYING_TOKEN,
      [encodeParameter("address", createAddress("0x0")), encodeParameter("address", TEST_VAULT_ADDR)],
      encodeParameter("uint256", toWei("11")),
    );

    const finding: Finding[] = await handleTransaction(txEvent);

    expect(finding).toStrictEqual([generateFinding(false, toWei("10"))]);
  });

  it("should returns a finding if the ERC20 transfer is from the Vault", async () => {
    handleTransaction = provideBigTransactionsAgent(mockWeb3, "TEST", TEST_VAULT_ADDR, toWei("10"));

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "Transfer(address,address,uint256)",
      TEST_VAULT_UNDERLYING_TOKEN,
      [encodeParameter("address", TEST_VAULT_ADDR), encodeParameter("address", createAddress("0x0"))],
      encodeParameter("uint256", toWei("11")),
    );

    const finding: Finding[] = await handleTransaction(txEvent);

    expect(finding).toStrictEqual([generateFinding(true, toWei("10"))]);
  });

  it("should returns empty finding if the ERC20 transfer is below the threshold", async () => {
    handleTransaction = provideBigTransactionsAgent(mockWeb3, "TEST", TEST_VAULT_ADDR, toWei("10"));

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "Transfer(address,address,uint256)",
      TEST_VAULT_UNDERLYING_TOKEN,
      [encodeParameter("address", TEST_VAULT_ADDR), encodeParameter("address", createAddress("0x0"))],
      encodeParameter("uint256", toWei("8")),
    );

    const finding: Finding[] = await handleTransaction(txEvent);

    expect(finding).toStrictEqual([]);
  });

  it("should returns multiple findings if there are multiple ERC20 trasnfer from or to the Vault", async () => {
    handleTransaction = provideBigTransactionsAgent(mockWeb3, "TEST", TEST_VAULT_ADDR, toWei("10"));

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        "Transfer(address,address,uint256)",
        TEST_VAULT_UNDERLYING_TOKEN,
        [encodeParameter("address", TEST_VAULT_ADDR), encodeParameter("address", createAddress("0x0"))],
        encodeParameter("uint256", toWei("20")),
      )
      .addEventLog(
        "Transfer(address,address,uint256)",
        TEST_VAULT_UNDERLYING_TOKEN,
        [encodeParameter("address", createAddress("0x0")), encodeParameter("address", TEST_VAULT_ADDR)],
        encodeParameter("uint256", toWei("20")),
      );

    const finding: Finding[] = await handleTransaction(txEvent);

    expect(finding).toStrictEqual([generateFinding(false, toWei("10")), generateFinding(true, toWei("10"))]);
  });
});
