import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createTxEventWithEventLogged, generalTestFindingGenerator, createAddress } from "./tests.utils";

import Web3 from "web3";
import provideERC20TransferAgent from "./events.checker";

const TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const createTransactionEventWithTransferLog = (
  tokenAddress: string,
  from: string,
  to: string,
  amount: string
): TransactionEvent => {
  const web3: Web3 = new Web3();
  const fromTopic: string = web3.eth.abi.encodeParameter("address", from);
  const toTopic: string = web3.eth.abi.encodeParameter("address", to);
  const data: string = web3.eth.abi.encodeParameter("uint256", amount);
  return createTxEventWithEventLogged("Transfer(address,address,uint256)", tokenAddress, [fromTopic, toTopic], data);
};

describe("ERC20 Transfer Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should returns empty findings if the expected event wasn't emitted", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTxEventWithEventLogged("badSignature", TOKEN_ADDRESS);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if the expected event wasn't emitted from the correct token", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      "0x0",
      createAddress("0x0"),
      createAddress("0x0"),
      createAddress("0x0")
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding only if the expected event was emitted from the correct token", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      createAddress("0x0")
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding only if the event has in the field `to` the correct address", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      "0x0",
      createAddress("0x0"),
      createAddress("0x0"),
      createAddress("0x0")
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding only if the event has in the field `from` the correct address", async () => {});

  it("should returns a finding only if the event has in the field `value` a value greater than the specified threshold", async () => {});

  it("should returns a finding only if all the conditions are met", async () => {});
});
