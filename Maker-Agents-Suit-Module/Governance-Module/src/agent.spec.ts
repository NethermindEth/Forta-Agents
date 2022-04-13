import { BlockEvent, Finding, TransactionEvent } from "forta-agent";
import { provideHandleTransaction, provideHandleBlock, CHIEF_CONTRACT } from "./agent";
import {
  AddressManager,
  createAddr,
  createEncodedAddr,
  createEncodedUint256,
  toBalance,
  HatFinding,
  LiftFinding,
} from "./utils";
import { runBlock, TestBlockEvent, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { MKR_THRESHOLD as threshold, createFinding as createHatFinding } from "./new.hat";
import DeployedAddressesManager from "./deployed.addresses.manager";
import BigNumber from "bignumber.js";
import { LIFT_EVENT, createFinding as createLiftFinding } from "./lift.events";

const deadAddr: string = createAddr("0xdead");
const deadContracts: string[] = [
  "0x2387b3383e89c164781d173b7aa14d9c46ed2642",
  "0x22bc2df58d96cbc5f2599f2c25d1e565974749ee",
  "0x7bbcfa8c109b0a6888d3329a6b762ad4782e0b26",
  "0x48c33395391c097df9c9aa887a40f1b47948d393",
  "0x13f8f173f6cbb87b606526853092f423537395ad",
  "0xf7d155cb4cf4ab327f15b14e207932b9fefb405a",
  "0x0e7ee05d6a4b12e549a05c4fdb926da2af057560",
  "0xc04c7477f209054ca74ed44e58a50443ec526d11",
  "0x2f9b83b70bd51a3bf6b23f44649a6d6d2cb3ac5c",
  "0x872c81f3569758132e5f2ded064a7f54e129086c",
];
const deadContractsEncoded = deadContracts.map((addr) => createEncodedAddr(addr));
const chiefInLower: string = CHIEF_CONTRACT.toLowerCase();

describe("Governance Module agent tests suite", () => {
  const mockWeb3Call = jest.fn();
  const mockWebGetTxCount = jest.fn();
  let addrManager: AddressManager;
  let agent: any;

  beforeEach(() => {
    mockWeb3Call.mockClear();
    mockWebGetTxCount.mockClear();
    addrManager = new DeployedAddressesManager(deadAddr, mockWebGetTxCount);
    agent = {
      handleTransaction: provideHandleTransaction(addrManager),
      handleBlock: provideHandleBlock(mockWeb3Call, addrManager),
    };
  });

  it("should return empty findings if no lift event occur and hat conditons are met", async () => {
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[0]);
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[0]);
    mockWeb3Call.mockReturnValueOnce(createEncodedUint256(toBalance(threshold)));
    mockWebGetTxCount.mockReturnValueOnce(2);

    const tx: TransactionEvent = new TestTransactionEvent();
    const block: BlockEvent = new TestBlockEvent().setNumber(2).addTransactions(tx);

    const findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);
  });

  it("should report unknown hat if the address is not deployed", async () => {
    // deadContract[2] not deployed at block 4
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[2]);
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[2]);
    mockWebGetTxCount.mockReturnValueOnce(2);

    const tx: TransactionEvent = new TestTransactionEvent();
    const block: TestBlockEvent = new TestBlockEvent().setNumber(4).addTransactions(tx);

    let findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([
      createHatFinding("MakerDAO-GM-1", HatFinding.UnknownHat, {
        hat: deadContracts[2],
      }),
    ]);

    // deadContract[2] deployed at block 5
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[2]);
    mockWeb3Call.mockReturnValueOnce(createEncodedUint256(toBalance(threshold)));
    mockWebGetTxCount.mockReturnValueOnce(3);

    block.setNumber(5);

    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);
  });

  it("should report multiple hat alerts", async () => {
    const approvals: BigNumber = threshold.minus(1);
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[6]);
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[7]);
    mockWeb3Call.mockReturnValueOnce(createEncodedUint256(toBalance(approvals)));
    mockWebGetTxCount.mockReturnValueOnce(8);

    const tx: TransactionEvent = new TestTransactionEvent();
    const block: BlockEvent = new TestBlockEvent().setNumber(7).addTransactions(tx);

    const findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([
      createHatFinding("MakerDAO-GM-1", HatFinding.HatModified, {
        hat: deadContracts[7],
        previousHat: deadContracts[6],
      }),
      createHatFinding("MakerDAO-GM-1", HatFinding.FewApprovals, {
        hat: deadContracts[7],
        MKR: toBalance(approvals).toString(),
        threshold: toBalance(threshold).toString(),
      }),
    ]);
  });

  it("should report lift events alert only in the unknown addresses", async () => {
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[0]);
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[0]);
    mockWeb3Call.mockReturnValueOnce(createEncodedUint256(toBalance(threshold)));
    mockWebGetTxCount.mockReturnValueOnce(2);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(chiefInLower, "", LIFT_EVENT, deadContractsEncoded[0], deadContractsEncoded[1])
      .addAnonymousEventLog(chiefInLower, "", LIFT_EVENT, deadContractsEncoded[8], deadContractsEncoded[1])
      .addAnonymousEventLog(chiefInLower, "", LIFT_EVENT, deadContractsEncoded[0], deadContractsEncoded[5])
      .addAnonymousEventLog(chiefInLower, "", LIFT_EVENT, deadContractsEncoded[2], deadContractsEncoded[3])
      .addInvolvedAddresses(chiefInLower);

    const block: BlockEvent = new TestBlockEvent().setNumber(4).addTransactions(tx);

    const findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([
      createLiftFinding("MakerDAO-GM-2", deadContracts[8], LiftFinding.Lifter),
      createLiftFinding("MakerDAO-GM-2", deadContracts[5], LiftFinding.Spell),
      createLiftFinding("MakerDAO-GM-2", deadContracts[2], LiftFinding.Lifter),
      createLiftFinding("MakerDAO-GM-2", deadContracts[3], LiftFinding.Spell),
    ]);
  });

  it("should report block and transaction findings", async () => {
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[0]);
    mockWeb3Call.mockReturnValueOnce(deadContractsEncoded[1]);
    mockWeb3Call.mockReturnValueOnce(createEncodedUint256(toBalance(threshold)));
    mockWebGetTxCount.mockReturnValueOnce(2);

    const txs: TransactionEvent[] = [
      new TestTransactionEvent() // Unknown lifter
        .addAnonymousEventLog(chiefInLower, "", LIFT_EVENT, deadContractsEncoded[2], deadContractsEncoded[0])
        .addInvolvedAddresses(chiefInLower),
      new TestTransactionEvent() // Unknown spell
        .addAnonymousEventLog(chiefInLower, "", LIFT_EVENT, deadContractsEncoded[1], deadContractsEncoded[3])
        .addInvolvedAddresses(chiefInLower),
      new TestTransactionEvent() // CHIEF contract is not in the txn involved addresses
        .addAnonymousEventLog(chiefInLower, "", LIFT_EVENT, deadContractsEncoded[6], deadContractsEncoded[4]),
    ];

    const block: BlockEvent = new TestBlockEvent().setNumber(10).addTransactions(...txs);

    const findings: Finding[] = await runBlock(agent, block, ...txs);
    expect(findings).toStrictEqual([
      createHatFinding("MakerDAO-GM-1", HatFinding.HatModified, {
        hat: deadContracts[1],
        previousHat: deadContracts[0],
      }),
      createLiftFinding("MakerDAO-GM-2", deadContracts[2], LiftFinding.Lifter),
      createLiftFinding("MakerDAO-GM-2", deadContracts[3], LiftFinding.Spell),
    ]);
  });
});
