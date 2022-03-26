import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { FUNCTION_SIGNATURES } from "./utils";

// function to generate test findings
const createFinding = (args: any[]) => {
  let finding;
  args[0] == "deposit"
    ? (finding = Finding.fromObject({
        name: `Large deposit on PGL staking contract`,
        description: `${args[0]} function was called in PGL staking contract with a large pglAmount`,
        alertId: "BENQI-7-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          user: args[2].toLowerCase(),
          pglAmount: args[1].toString(),
        },
      }))
    : (finding = Finding.fromObject({
        name: `Large redeem on PGL staking contract`,
        description: `${args[0]} function was called in PGL staking contract with a large pglAmount`,
        alertId: "BENQI-7-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          user: args[2].toLowerCase(),
          pglAmount: args[1].toString(),
        },
      }));
  return finding;
};

// const used for tests
const TEST_PGL_STAKING = createAddress("0xa1");
const PGL_IFACE = new Interface(FUNCTION_SIGNATURES);
const DIFFERENT_CONTRACT = createAddress("0xff");
const IRRELEVANT_IFACE = new Interface(["function irrelevant1()"]);

// Data used in different tests <function name, pglAmount>
const TEST_DATA: [string, BigNumber][] = [
  ["deposit", BigNumber.from(80)], // deposit with regular pglAmount.
  ["deposit", BigNumber.from(250)], // deposit with large pglAmount.
  ["redeem", BigNumber.from(100)], // redeem with regular pglAmount.
  ["redeem", BigNumber.from(300)], // redeem with large pglAmount.
];
const USERS = [createAddress("0xb1"), createAddress("0xb2"), createAddress("0xb3")];

// mock Fetcher
const mockGetSupplies = jest.fn();
const mockFetcher = {
  pglStakingAddress: TEST_PGL_STAKING,
  getTotalSupplies: mockGetSupplies,
};

// init the agent
const handler = provideHandleTransaction(20, mockFetcher as any);

// set the totalSupplies used in tests
mockFetcher.getTotalSupplies.mockResolvedValue(BigNumber.from(1000));

describe("Large Deposits-Redeems agent tests suite", () => {
  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other calls on PGL staking contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(USERS[0]).addTraces({
      to: TEST_PGL_STAKING,
      from: createAddress("0xa2"),
      input: IRRELEVANT_IFACE.encodeFunctionData("irrelevant1", []),
    });

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore calls on a different contract", async () => {
    // deposit call with large pglAmount
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(USERS[0]).addTraces({
      to: DIFFERENT_CONTRACT,
      from: USERS[0],
      input: PGL_IFACE.encodeFunctionData("deposit", [TEST_DATA[1][1]]),
    });

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore deposit/redeem calls with regular amounts on PGL staking contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(USERS[1])
      // deposit call with regular pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[1],
        input: PGL_IFACE.encodeFunctionData("deposit", [TEST_DATA[0][1]]),
      })
      // redeem call with regular pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[1],
        input: PGL_IFACE.encodeFunctionData("redeem", [TEST_DATA[2][1]]),
      });

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when deposit amount is above the threshold", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(USERS[1])
      // deposit call with large pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[1],
        input: PGL_IFACE.encodeFunctionData("deposit", [TEST_DATA[1][1]]),
      });

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([createFinding([TEST_DATA[1], USERS[1]].flat())]);
  });

  it("should return a finding when redeem amount is above the threshold", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(USERS[2])
      // redeem call with large pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[2],
        input: PGL_IFACE.encodeFunctionData("redeem", [TEST_DATA[3][1]]),
      });

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([createFinding([TEST_DATA[3], USERS[2]].flat())]);
  });

  it("should return findings only for deposit/redeem calls with large PGL amounts", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(USERS[1])
      // deposit with regular pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[1],
        input: PGL_IFACE.encodeFunctionData("deposit", [TEST_DATA[0][1]]),
      })
      // deposit with large pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[1],
        input: PGL_IFACE.encodeFunctionData("deposit", [TEST_DATA[1][1]]),
      })
      // redeem with regular pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[1],
        input: PGL_IFACE.encodeFunctionData("redeem", [TEST_DATA[2][1]]),
      })
      // redeem with large pglAmount
      .addTraces({
        to: TEST_PGL_STAKING,
        from: USERS[1],
        input: PGL_IFACE.encodeFunctionData("redeem", [TEST_DATA[3][1]]),
      });

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([
      createFinding([TEST_DATA[1], USERS[1]].flat()),
      createFinding([TEST_DATA[3], USERS[1]].flat()),
    ]);
  });
});
