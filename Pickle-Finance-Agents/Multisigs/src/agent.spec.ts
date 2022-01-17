import {
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import {
  provideHandleTransaction,
} from "./agent";
import { createAddress, decodeParameter, encodeParameter, encodeParameters, TestTransactionEvent } from "forta-agent-tools";
import utils from "./utils";
import expectedFindings from "./test.utils"
import { toWei } from "web3-utils";

const MULTISIGS: string[] = [
  createAddress("0xda01"),
  createAddress("0xda02"),
  createAddress("0xda03"),
  createAddress("0xda04"),
];

describe("Mutisigs agent test suite", () => {
  const handler: HandleTransaction = provideHandleTransaction(MULTISIGS, "1");

  it("Should return empty findings when nothing happend", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should detect AddedOwner event only when emitted in a multisig wallet", async () => {
    const owner: string = createAddress("0xb1");
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(utils.ADDED_OWNER, MULTISIGS[0], encodeParameter("address", owner))
      .addEventLog(utils.ADDED_OWNER, createAddress("0xdead"), encodeParameter("address", owner))
      .addEventLog(utils.ADDED_OWNER, MULTISIGS[1], encodeParameter("address", owner));

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFindings.createOwnerAddedFindingGenerator(
        MULTISIGS[0],
        owner,
      ),
      expectedFindings.createOwnerAddedFindingGenerator(
        MULTISIGS[1],
        owner,
      ),
    ]);
  });

  it("Should detect RemovedOwner event only when emitted in a multisig wallet", async () => {
    const owner: string = createAddress("0xb1");
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(utils.REMOVED_OWNER, MULTISIGS[0], encodeParameter("address", owner))
      .addEventLog(utils.REMOVED_OWNER, createAddress("0xdead"), encodeParameter("address", owner))
      .addEventLog(utils.REMOVED_OWNER, MULTISIGS[1], encodeParameter("address", owner));


    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFindings.createOwnerRemovedFindingGenerator(
        MULTISIGS[0],
        owner,
      ),
      expectedFindings.createOwnerRemovedFindingGenerator(
        MULTISIGS[1],
        owner,
      ),
    ]);
  });

  it("Should detect ExecutionFailure event only when emitted in a multisig wallet", async () => {
    const hash: string = "0x176a4d5e456beee21c75110225c79bc81646435c4ace77a4d27e6e052f282eac";
    const payment: string = "50";
    const data: string = encodeParameters(["bytes32", "uint256"], [hash, BigInt(payment)])
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(utils.EXECUTION_SUCCESS, MULTISIGS[0], data)
      .addEventLog(utils.EXECUTION_SUCCESS, createAddress("0xdead"), data)
      .addEventLog(utils.EXECUTION_SUCCESS, MULTISIGS[1], data);


    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFindings.createExecutionSuccessFindingGenerator(
        MULTISIGS[0],
        hash,
        payment,
      ),
      expectedFindings.createExecutionSuccessFindingGenerator(
        MULTISIGS[1],
        hash,
        payment,
      ),
    ]);
  });

  it("Should detect ExecutionSuccess event only when emitted in a multisig wallet", async () => {
    const hash: string = "0x176a4d5e456beee21c75110225c79bc81646435c4ace77a4d27e6e052f282eac";
    const payment: string = "50";
    const data: string = encodeParameters(["bytes32", "uint256"], [hash, BigInt(payment)])
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(utils.EXECUTION_FAILURE, MULTISIGS[0], data)
      .addEventLog(utils.EXECUTION_FAILURE, createAddress("0xdead"), data)
      .addEventLog(utils.EXECUTION_FAILURE, MULTISIGS[1], data);


    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFindings.createExecutionFailureFindingGenerator(
        MULTISIGS[0],
        hash,
        payment,
      ),
      expectedFindings.createExecutionFailureFindingGenerator(
        MULTISIGS[1],
        hash,
        payment,
      ),
    ]);
  });

  it("Should detect ERC20 transfers only when tokens are sent from a multisig with the correct signature", async () => {
    const addr: string = createAddress("0x1");
    const token1: string = createAddress("0xcafe1");
    const token2: string = createAddress("0xcafe2");
    const value: string = "200";
    
    const all_in_data: string = encodeParameters(
      ["address", "address", "uint256"], 
      [MULTISIGS[0], addr, BigInt(value)],
    );
    const from_addr_in_data: string = encodeParameters(
      ["address", "uint256"], 
      [MULTISIGS[0], BigInt(value)],
    );
    const to_addr_in_data: string = encodeParameters(
      ["address", "uint256"], 
      [addr, BigInt(value)],
    );
    const encoded_multisig: string = encodeParameter("address", MULTISIGS[0]);
    const encoded_addr: string = encodeParameter("address", addr);
    const encoded_value: string = encodeParameter("uint256", BigInt(value));
    // encoded 2^161
    const high_enoded_value: string = encodeParameter("uint256", BigInt("2923003274661805836407369665432566039311865085952"));

    const tx: TransactionEvent = new TestTransactionEvent()
      // Transfer(address, address, uint256)
      .addEventLog(utils.TRANSFER, token1, all_in_data) 
      // Transfer(address, indexed address, uint256)
      .addEventLog(utils.TRANSFER, token2, from_addr_in_data, encoded_addr) 
      // Transfer(indexed address, address, uint256)
      .addEventLog(utils.TRANSFER, token2, to_addr_in_data, encoded_multisig) 
      // correct ERC20 signature
      .addEventLog(utils.TRANSFER, token1, encoded_value, encoded_multisig, encoded_addr) 
      // Transfer(address, indexed address, indexed uint256)
      .addEventLog(utils.TRANSFER, token2, encoded_multisig, encoded_addr, encoded_value) 
      // Transfer(indexed address, address, indexed uint256) 
      // (False positive) indexed value fit in address type & topics[1] is multisig address
      .addEventLog(utils.TRANSFER, token1, encoded_addr, encoded_multisig, encoded_value) 
      // correct ERC20 signature
      .addEventLog(utils.TRANSFER, token2, encoded_value, encoded_multisig, encoded_addr)
      // Transfer(indexed address, address, indexed uint256) 
      // False positive candidate with value to high to fit in address type
      .addEventLog(utils.TRANSFER, token1, encoded_addr, encoded_multisig, high_enoded_value);


    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFindings.createERC20TransferFindingGenerator(
        MULTISIGS[0],
        addr, 
        token1,
        BigInt(value),
      ),
      expectedFindings.createERC20TransferFindingGenerator( // False positive
        MULTISIGS[0],
        decodeParameter("address", encoded_value).toLowerCase(),
        token1,
        BigInt(decodeParameter("uint256", encoded_addr)),
      ),
      expectedFindings.createERC20TransferFindingGenerator(
        MULTISIGS[0],
        addr,
        token2,
        BigInt(value),
      ),
    ]);
  });

  it("Should detect ETH transfers only when tokens are sent from a multisig", async () => {
    const addr1: string = createAddress("0xcafe1"); 
    const addr2: string = createAddress("0xcafe2"); 
    const tx: TransactionEvent = new TestTransactionEvent().addTraces(
      {value: toWei("3"), from: MULTISIGS[0], to: addr1},
      {value: toWei("2"), from: addr2, to: addr1},
      {value: "1", from: MULTISIGS[1], to: addr2},
      {value: "0", from: MULTISIGS[0], to: MULTISIGS[1]},
      {value: "10", from: MULTISIGS[1], to: MULTISIGS[0]},
    )
  
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      expectedFindings.createETHTransferFindingGenerator(
        MULTISIGS[0],
        addr1,
        toWei("3"),
      ),
      expectedFindings.createETHTransferFindingGenerator(
        MULTISIGS[1],
        addr2,
        "1",
      ),
      expectedFindings.createETHTransferFindingGenerator(
        MULTISIGS[1],
        MULTISIGS[0],
        "10",
      ),
    ]);
  });

  it("Should detect multiple events", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent();
    const expected: Finding[] = [];

    MULTISIGS.forEach(
      (ens: string, i: number) => {
        const ens_addr: string = MULTISIGS[i];
        const owner: string = createAddress(`0xb${i}`);
        const hash: string = "0x176a4d5e456beee21c75110225c79bc81646435c4ace77a4d27e6e052f282eac";
        const value: string = `20${i}`;
        const data: string = encodeParameters(["bytes32", "uint256"], [hash, BigInt(value)])
        const token: string = createAddress(`0xc${i}`);
        const addr: string = createAddress(`0xd${i}`);
        const encoded_multisig: string = encodeParameter("address", ens_addr);
        const encoded_addr: string = encodeParameter("address", addr);
        const encoded_value: string = encodeParameter("uint256", BigInt(value));

        tx.addEventLog(utils.ADDED_OWNER, ens_addr, encodeParameter("address", owner))
          .addEventLog(utils.REMOVED_OWNER, ens_addr, encodeParameter("address", owner))
          .addEventLog(utils.EXECUTION_SUCCESS, ens_addr, data)
          .addEventLog(utils.EXECUTION_FAILURE, ens_addr, data)
          .addEventLog(utils.TRANSFER, token, encoded_value, encoded_multisig, encoded_addr)
          .addTraces({value: toWei(value), from: ens_addr, to: addr});

        expected.push(expectedFindings.createOwnerAddedFindingGenerator(ens, owner));
        expected.push(expectedFindings.createOwnerRemovedFindingGenerator(ens, owner));
        expected.push(expectedFindings.createExecutionSuccessFindingGenerator(ens, hash, value));
        expected.push(expectedFindings.createExecutionFailureFindingGenerator(ens, hash, value));
        expected.push(expectedFindings.createERC20TransferFindingGenerator(ens, addr, token, BigInt(value)));
        expected.push(expectedFindings.createETHTransferFindingGenerator(ens, addr, toWei(value)));
      }
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual(expected);
  });
});
