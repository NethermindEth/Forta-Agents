import { Finding, FindingSeverity, FindingType, HandleBlock } from "forta-agent";
import { TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";

const createGenericFinding = (id: number): Finding =>
  Finding.fromObject({
    name: "Generic Finding",
    description: `Generic Finding #${id}`,
    alertId: `GENERIC-${id}`,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Generic Finance",
  });

const updater = (findings: Finding[][]) => (n: number) => {
  const newFindings: Finding[] = [];
  for (let i = 0; i < n; ++i) newFindings.push(createGenericFinding(i));
  findings.push(newFindings);
  return newFindings;
};

describe("Instant Withdraw agent tests suite", () => {
  let findingsList: Finding[][] = [];
  let add: any;
  let handler: HandleBlock;
  const period: number = 10;

  beforeEach(() => {
    findingsList = [];
    add = updater(findingsList);
    handler = provideHandleBlock(period, findingsList, 0);
  });

  it("should return the latest batch of findings", async () => {
    const CASES: number[] = [1, 10, 4, 5, 1];

    let timestamp: number = 0;
    for (let batches of CASES) {
      for (let i = 1; i <= batches; ++i) add(i);
      const lastBatch: Finding[] = findingsList[batches - 1];
      // increase the timestamp to always report findings
      timestamp += period;
      const findings: Finding[] = await handler(
        new TestBlockEvent().setTimestamp(timestamp)
      );
      expect(findings).toStrictEqual(lastBatch);
      expect(findingsList).toStrictEqual([]);
    }
  });

  it("should return no findings if period is not passed", async () => {
    // timestamp, should report
    const CASES: [number, boolean][] = [
      [2, false],
      [3, false],
      [10, true],
      [11, false],
      [1100, true],
      [2000, true],
      [2009, false],
    ];

    for (let i = 0; i < CASES.length; ++i) {
      const last: Finding[] = add(i + 1);
      const [timestamp, report] = CASES[i];

      const findings: Finding[] = await handler(
        new TestBlockEvent().setTimestamp(timestamp)
      );

      if (report) expect(findings).toStrictEqual(last);
      else expect(findings).toStrictEqual([]);
    }
  });
});
