import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  EventType,
  Network,
} from "forta-agent";
import { provideHandleTransaction, createFinding } from ".";

const BLACKLISTED_ADDRESSES: string[] = [
  "0x121212",
  "0x131313",
];



describe("Detect transaction involving blacklisted addresse", () => {
  let handleTransaction: HandleTransaction;
  const createTxEvent = (addressesInvolved: { [key: string]: boolean }) => {
    const tx = {} as any;
    const receipt = { } as any;
    const block = {} as any;
    const addresses = addressesInvolved as any;
    return new TransactionEvent(
      EventType.BLOCK,
      Network.MAINNET,
      tx,
      receipt,
      [],
      addresses,
      block
    );
  };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(BLACKLISTED_ADDRESSES);
  });

  it("returns empty findings if there are not blacklisted addresses involved", async () => {
    const addressesInvolved: { [key: string]: boolean } = {
      "0x111111": true,
      "0x141414": true
    }

    const txEvent = createTxEvent(addressesInvolved);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a blacklisted address is involved", async () => {
    const addressesInvolved: { [key: string]: boolean } = {
      "0x111111": true,
      "0x121212": true
    }
    const txEvent = createTxEvent(addressesInvolved);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(["0x121212"])]);
  });

  it("returns a finding if multiple blacklisted addresses are involved", async () => {
    const addressesInvolved: { [key: string]: boolean } = {
      "0x121212": true,
      "0x131313": true,
    }
    const txEvent = createTxEvent(addressesInvolved);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(["0x121212", "0x131313"]),
    ]);
  });
});
