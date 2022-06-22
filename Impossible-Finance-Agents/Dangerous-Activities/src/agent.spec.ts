import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import utils from "./utils";

const toAddresses = (list: string[]) => list.map((x) => createAddress(x));

const createFinding = (impossible: string[], dangerous: string[]) =>
  Finding.fromObject({
    name: "Impossible Finance interaction monitor",
    description: "A known dangerous address has interacted with an Impossible Finance smart contract",
    alertId: "IMPOSSIBLE-8",
    protocol: "Impossible Finance",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      impossibleAddresses: toAddresses(impossible).toString(),
      dangerousAddresses: toAddresses(dangerous).toString(),
    },
  });

describe("Dangerous Activities monitor tests suite", () => {
  const buildHandler = (list0: string[], list1: string[]) =>
    provideHandleTransaction(utils.listVerifier(toAddresses(list0)), utils.listVerifier(toAddresses(list1)));

  it("should detect dangerous interaction", async () => {
    const handler: HandleTransaction = buildHandler(["0xf00d", "0xdead"], ["0xbad", "0xfee", "0xb4d", "0xf33"]);

    const tx: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(
      ...toAddresses(["0xf00d", "0xdead", "0xda0", "0xfee", "0xb4d"])
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([createFinding(["0xf00d", "0xdead"], ["0xfee", "0xb4d"])]);
  });

  it("should ignore impossible interaction if no dangerous addresses are involved", async () => {
    const handler: HandleTransaction = buildHandler(["0xdef1", "0xd40", "0xe04"], ["0xc001", "0xf11e"]);

    const tx: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(
      ...toAddresses(["0xf00d", "0xe04", "0xdef1", "0xc0ld"])
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore dangerous interaction if no impossible addresses are involved", async () => {
    const handler: HandleTransaction = buildHandler(["0xdef1", "0xd40", "0xe04"], ["0xdeade0a", "0xbade0a"]);

    const tx: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(
      ...toAddresses(["0xfa57", "0x505", "0xbade0a", "0xdead"])
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });
});
