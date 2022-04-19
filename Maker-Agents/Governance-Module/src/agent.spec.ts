import HatFetcher from "./hat.fetcher";
import { utils, BigNumber } from "ethers";
import { createFinding as createHatFinding } from "./new.hat";
import DeployedAddressesManager from "./deployed.addresses.manager";
import { BlockEvent, Finding, TransactionEvent } from "forta-agent";
import { AddressManager, toBalance, HatFinding, LiftFinding } from "./utils";
import { LIFT_EVENT, createFinding as createLiftFinding } from "./lift.events";
import { provideHandleTransaction, provideHandleBlock } from "./agent";
import {
  runBlock,
  TestBlockEvent,
  TestTransactionEvent,
  createAddress,
  MockEthersProvider,
} from "forta-agent-tools/lib/tests";
import { mockWrapper } from "./test.utils";

const encodedAddr = (addr: string) => utils.defaultAbiCoder.encode(["address"], [createAddress(addr)]);

const deadAddr: string = createAddress("0xdead");
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
const deadContractsEncoded = deadContracts.map((addr) => encodedAddr(addr));

describe("Governance Module agent tests suite", () => {
  let agent: any;
  let addrManager: AddressManager;
  const threshold = BigNumber.from(40000);
  const chief: string = createAddress("0xda0");
  const { setHat, setApproval, mockProvider } = mockWrapper(chief);
  let mockAddressFetcher: any;

  beforeAll(() => {
    mockAddressFetcher = {
      getChiefAddress: jest.fn(),
      chiefAddress: chief,
    };
  });
  beforeEach(() => {
    mockProvider.clear();
    addrManager = new DeployedAddressesManager(deadAddr, mockProvider as any);
    agent = {
      handleTransaction: provideHandleTransaction(addrManager, addrManager, mockAddressFetcher),
      handleBlock: provideHandleBlock(threshold, addrManager, new HatFetcher(mockAddressFetcher, mockProvider as any)),
    };
  });

  it("should return empty findings if no lift event occurred and hat conditons are met", async () => {
    const nonce: number = 2;
    const blockNumber: number = 2;
    const hat: string = deadContracts[0];
    setHat(blockNumber - 1, hat);
    setApproval(blockNumber, hat, toBalance(threshold));
    mockProvider.setNonce(deadAddr, blockNumber, nonce);

    const tx: TransactionEvent = new TestTransactionEvent();
    const block: BlockEvent = new TestBlockEvent().setNumber(blockNumber).addTransactions(tx);

    const findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);
  });

  it("should report unknown hat if the address is not deployed", async () => {
    // deadContract[2] not deployed at block 4
    const nonce: number = 2;
    const blockNumber: number = 4;
    const hat: string = deadContracts[2];
    setHat(blockNumber - 1, hat);
    setHat(blockNumber, hat);
    mockProvider.setNonce(deadAddr, blockNumber, nonce);

    const tx: TransactionEvent = new TestTransactionEvent();
    const block: TestBlockEvent = new TestBlockEvent().setNumber(blockNumber).addTransactions(tx);

    let findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([
      createHatFinding("MakerDAO-GM-1", HatFinding.UnknownHat, {
        hat: deadContracts[2],
      }),
    ]);

    // deadContract[2] deployed at block 5
    setApproval(blockNumber + 1, hat, toBalance(threshold));
    mockProvider.setNonce(deadAddr, blockNumber + 1, nonce + 1);

    block.setNumber(blockNumber + 1);

    findings = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([]);
  });

  it("should report multiple hat alerts", async () => {
    const nonce: number = 8;
    const blockNumber: number = 7;
    const previousHat: string = deadContracts[6];
    const hat: string = deadContracts[7];
    setHat(blockNumber - 1, previousHat);
    setApproval(blockNumber, hat, toBalance(threshold.sub(1)));
    mockProvider.setNonce(deadAddr, blockNumber, nonce);

    const tx: TransactionEvent = new TestTransactionEvent();
    const block: BlockEvent = new TestBlockEvent().setNumber(blockNumber).addTransactions(tx);

    const findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([
      createHatFinding("MakerDAO-GM-1", HatFinding.HatModified, {
        hat: deadContracts[7],
        previousHat: deadContracts[6],
      }),
      createHatFinding("MakerDAO-GM-1", HatFinding.FewApprovals, {
        hat: deadContracts[7],
        MKR: toBalance(threshold.sub(1)).toString(),
        threshold: toBalance(threshold).toString(),
      }),
    ]);
  });

  it("should report lift events alert only in the unknown addresses", async () => {
    const nonce: number = 2;
    const blockNumber: number = 4;
    const hat: string = deadContracts[0];
    setHat(blockNumber - 1, hat);
    setApproval(blockNumber, hat, toBalance(threshold));
    mockProvider.setNonce(deadAddr, blockNumber, nonce);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(chief, "0x", LIFT_EVENT, deadContractsEncoded[0], deadContractsEncoded[1])
      .addAnonymousEventLog(chief, "0x", LIFT_EVENT, deadContractsEncoded[8], deadContractsEncoded[1])
      .addAnonymousEventLog(chief, "0x", LIFT_EVENT, deadContractsEncoded[0], deadContractsEncoded[5])
      .addAnonymousEventLog(chief, "0x", LIFT_EVENT, deadContractsEncoded[2], deadContractsEncoded[3])
      .addInvolvedAddresses(chief);

    const block: BlockEvent = new TestBlockEvent().setNumber(blockNumber).addTransactions(tx);

    const findings: Finding[] = await runBlock(agent, block, tx);
    expect(findings).toStrictEqual([
      createLiftFinding("MakerDAO-GM-2", deadContracts[8], LiftFinding.Lifter),
      createLiftFinding("MakerDAO-GM-2", deadContracts[5], LiftFinding.Spell),
      createLiftFinding("MakerDAO-GM-2", deadContracts[2], LiftFinding.Lifter),
      createLiftFinding("MakerDAO-GM-2", deadContracts[3], LiftFinding.Spell),
    ]);
  });

  it("should report block and transaction findings", async () => {
    const nonce: number = 2;
    const blockNumber: number = 10;
    const previousHat: string = deadContracts[0];
    const hat: string = deadContracts[1];
    setHat(blockNumber - 1, previousHat);
    setApproval(blockNumber, hat, toBalance(threshold));
    mockProvider.setNonce(deadAddr, blockNumber, nonce);

    const txs: TransactionEvent[] = [
      new TestTransactionEvent() // Unknown lifter
        .addAnonymousEventLog(chief, "", LIFT_EVENT, deadContractsEncoded[2], deadContractsEncoded[0])
        .addInvolvedAddresses(chief),
      new TestTransactionEvent() // Unknown spell
        .addAnonymousEventLog(chief, "", LIFT_EVENT, deadContractsEncoded[1], deadContractsEncoded[3])
        .addInvolvedAddresses(chief),
      new TestTransactionEvent() // CHIEF contract is not in the txn involved addresses
        .addAnonymousEventLog(chief, "", LIFT_EVENT, deadContractsEncoded[6], deadContractsEncoded[4]),
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
