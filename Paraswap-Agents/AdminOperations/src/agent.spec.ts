import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { Finding, FindingType, FindingSeverity, TransactionEvent, HandleTransaction } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { ADMIN_OPERATIONS } from "./utils";

// AugustusSwapper address
const SWAPPER_ADDR = createAddress("0xa1");
// Address used to initiate transactions
const USER_ADDR = createAddress("0xaa");
// Swapper contract Interface
export const SWAPPER_IFACE = new Interface(ADMIN_OPERATIONS);
// Irrelevant events/ functions used for tests
const IRRELEVANT_IFACE = new Interface(["event wrongsig()", "function wrongFunction()"]);

const TEST_DATA = [
  [createAddress("0xb1"), createAddress("0xc1"), BigNumber.from(10)], // transferTokens args
  [createAddress("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"), createAddress("0xc2"), BigNumber.from(80)], // transferTokens args (ETH transfer)
  [createAddress("0xb3"), createAddress("0xc3"), BigNumber.from(90)], // transferTokens args
  ["0xafde1234", createAddress("0xd1")], // setImplementation args
  [createAddress("0xd3")], // setFeeWallet args
  [createAddress("0xd4")], // RouterInitialized args
  [createAddress("0xd5")], // AdapterInitialized args
  [createAddress("0xd6"), BigNumber.from(20), true, false, 1, "partnerId", "0xda12"], // registerPartner args
];

// function to generate test findings
const createFinding = (operationName: string, args: any[]) => {
  switch (operationName) {
    case "transferTokens":
      const ETH_TRANSFER = args[0] === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

      return Finding.fromObject({
        name: `Admin operation detected: ${ETH_TRANSFER ? "ETH" : "tokens"} transfer`,
        description: `${operationName} function was called in AugustusSwapper contract`,
        alertId: "PARASWAP-1-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          token: ETH_TRANSFER ? "ETH" : args[0].toLowerCase(),
          destination: args[1].toLowerCase(),
          amount: args[2].toString(),
        },
      });

    case "setImplementation":
      return Finding.fromObject({
        name: `Admin operation detected: Implementation upgraded`,
        description: `${operationName} function was called in AugustusSwapper contract`,
        alertId: "PARASWAP-1-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          selector: args[0].toLowerCase(),
          implementation: args[1].toLowerCase(),
        },
      });

    case "setFeeWallet":
      return Finding.fromObject({
        name: `Admin operation detected: Fee Wallet address changed`,
        description: `${operationName} function was called in AugustusSwapper contract`,
        alertId: "PARASWAP-1-5",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          new_address: args[0].toLowerCase(),
        },
      });

    case "registerPartner":
      return Finding.fromObject({
        name: `Admin operation detected: new Partner registred`,
        description: `${operationName} function was called in AugustusSwapper contract`,
        alertId: "PARASWAP-1-4",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          partner: args[0].toLowerCase(),
          partnerShare: args[1].toString(),
          noPositiveSlippage: args[2],
          positiveSlippageToUser: args[3],
          feePercent: args[4].toString(),
        },
      });

    default:
      // "RouterInitialized"  or "AdapterInitialized"
      let name = operationName == "RouterInitialized" ? "Router" : "Adapter";
      return Finding.fromObject({
        name: `Admin operation detected: ${name} has been initialized`,
        description: `${operationName} event was emitted in AugustusSwapper contract`,
        alertId: "PARASWAP-1-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          address: args[0].toLowerCase(),
        },
      });
  }
};

describe("Paraswap Admin operations Agent test suite", () => {
  let handler: HandleTransaction = provideHandleTransaction(SWAPPER_ADDR);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore admin operations on a different Contract", async () => {
    const IRRELEVANT_IFACE = createAddress("0xff");

    // create events and calls on a different address
    const log1 = SWAPPER_IFACE.encodeEventLog(SWAPPER_IFACE.getEvent("RouterInitialized"), TEST_DATA[5]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(USER_ADDR)
      // Add call to `setImplementation`
      .addTraces({
        to: IRRELEVANT_IFACE,
        from: USER_ADDR,
        input: SWAPPER_IFACE.encodeFunctionData(
          "setImplementation",
          TEST_DATA[3] // setImplementation args
        ),
      })
      // Add call to `setFeeWallet`
      .addTraces({
        to: IRRELEVANT_IFACE,
        from: USER_ADDR,
        input: SWAPPER_IFACE.encodeFunctionData(
          "setFeeWallet",
          TEST_DATA[4] // setFeeWallet args
        ),
      })
      // Add log of `RouterInitialized` event
      .addAnonymousEventLog(IRRELEVANT_IFACE, log1.data, ...log1.topics);

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other event logs and function calls on AugustusSwapper Contract", async () => {
    const log1 = IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("wrongsig"), []);
    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(USER_ADDR)
      // Add call to another function
      .addTraces({
        to: SWAPPER_ADDR,
        from: USER_ADDR,
        input: IRRELEVANT_IFACE.encodeFunctionData("wrongFunction", []),
      })
      .addAnonymousEventLog(SWAPPER_ADDR, log1.data, ...log1.topics);

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return findings when admin operations are executed on AugustusSwapper Contract", async () => {
    const log1 = SWAPPER_IFACE.encodeEventLog(SWAPPER_IFACE.getEvent("AdapterInitialized"), TEST_DATA[6]);
    const log2 = SWAPPER_IFACE.encodeEventLog(SWAPPER_IFACE.getEvent("RouterInitialized"), TEST_DATA[5]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(USER_ADDR)
      // Add call to `setImplementation`
      .addTraces({
        to: SWAPPER_ADDR,
        from: USER_ADDR,
        input: SWAPPER_IFACE.encodeFunctionData(
          "setImplementation",
          TEST_DATA[3] // setImplementation args
        ),
      })
      // Add call to `setFeeWallet`
      .addTraces({
        to: SWAPPER_ADDR,
        from: USER_ADDR,
        input: SWAPPER_IFACE.encodeFunctionData(
          "setFeeWallet",
          TEST_DATA[4] // setFeeWallet args
        ),
      })
      // Add call to `registerPartner`
      .addTraces({
        to: SWAPPER_ADDR,
        from: USER_ADDR,
        input: SWAPPER_IFACE.encodeFunctionData(
          "registerPartner",
          TEST_DATA[7] // setFeeWallet args
        ),
      })
      // Add log of `AdapterInitialized` event
      .addAnonymousEventLog(SWAPPER_ADDR, log1.data, ...log1.topics)
      // Add log of `RouterInitialized` event
      .addAnonymousEventLog(SWAPPER_ADDR, log2.data, ...log2.topics);

    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("AdapterInitialized", TEST_DATA[6]),
      createFinding("RouterInitialized", TEST_DATA[5]),
      createFinding("setImplementation", TEST_DATA[3]),
      createFinding("setFeeWallet", TEST_DATA[4]),
      createFinding("registerPartner", TEST_DATA[7]),
    ]);
  });

  it("Should detect both ETH and other tokens transfer through transferTokens calls", async () => {
    // Add transferTokens calls to the transaction
    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(USER_ADDR)
      // ERC 20 Token transfer
      .addTraces({
        to: SWAPPER_ADDR,
        from: USER_ADDR,
        input: SWAPPER_IFACE.encodeFunctionData(
          "transferTokens",
          TEST_DATA[0] // transferTokens args
        ),
      })
      // ETH transfer
      .addTraces({
        to: SWAPPER_ADDR,
        from: USER_ADDR,
        input: SWAPPER_IFACE.encodeFunctionData(
          "transferTokens",
          TEST_DATA[1] // transferTokens args
        ),
      });

    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("transferTokens", TEST_DATA[0]),
      createFinding("transferTokens", TEST_DATA[1]),
    ]);
  });
});
