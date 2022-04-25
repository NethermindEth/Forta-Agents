import { Finding, HandleTransaction } from "forta-agent";
import { provideAgentHandler } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { createFinding as deviationFinding } from "./big.queued.price.deviation";
import { createFinding as priceUpdateFinding } from "./price.update.check";
import { createFinding as relyFinding } from "./rely.function.spec";
import { createFinding as denyFinding } from "./deny.function.spec";
import { utils } from "ethers";
import { defaultAbiCoder, formatBytes32String, Interface } from "ethers/lib/utils";
import {
  RELY_FUNCTION_SIG,
  DENY_FUNCTION_SIG,
  PEEK_FUNCTION_SELECTOR,
  PEEK_ABI,
  EVENTS_ABIS,
  CHAIN_LOG,
} from "./utils";

const CONTRACTS: Map<string, string> = new Map<string, string>([
  ["PIP_ONE", createAddress("0xa1")],
  ["PIP_TWO", createAddress("0xa2")],
  ["PIP_THREE", createAddress("0xa3")],
]);
const megaPokerAddress = "0x2417c2762ec12f2696f62cfa5492953b9467dc81";

const pokeFunctionSelector = "0x18178358";
const peekFunctionSelector = "0x59e02dd7";

const previousHourForActivatingAgent = 1467018381;
const lessThanTenMinutes = 1467021981; // "Mon, 27 Jun 2016 10:06:21 GMT"
const greaterThanTenMinutes = 1467022981; // "Mon, 27 Jun 2016 10:23:01 GMT"

const peek_ABI = new utils.Interface(["function peek() public view returns (bytes32, bool)"]);
const logIface = new utils.Interface(["event LogValue(bytes32 val)"]);
const relyIface = new utils.Interface([RELY_FUNCTION_SIG]);
const denyIface = new utils.Interface([DENY_FUNCTION_SIG]);

describe("OSM Agent Test Suite", () => {
  let transactionHandler: HandleTransaction;
  let mockFetcher: any;
  let updateAddresses = jest.fn();
  let getOsmAddresses = jest.fn();
  beforeAll(() => {
    mockFetcher = {
      osmContracts: CONTRACTS,
      getOsmAddresses,
      updateAddresses,
    };
  });
  beforeEach(() => {
    transactionHandler = provideAgentHandler(mockFetcher);
  });

  it("should return empty findings is not expected events happens", async () => {
    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));

    expect(findings).toStrictEqual([]);
  });

  it("should return findings from multiple handlers", async () => {
    let findings: Finding[] = [];
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);

    const txEvent1 = new TestTransactionEvent().setTimestamp(previousHourForActivatingAgent);
    const txEvent2 = new TestTransactionEvent().setTimestamp(lessThanTenMinutes);
    const txEvent3 = new TestTransactionEvent()
      .setTimestamp(greaterThanTenMinutes)
      .addTraces({
        from: CONTRACTS.get("PIP_TWO") as string,
        input: peekFunctionSelector,
        output: peek_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [107]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_TWO") as string, log.data, ...log.topics);

    findings = findings.concat(await transactionHandler(txEvent1));
    findings = findings.concat(await transactionHandler(txEvent2));
    findings = findings.concat(await transactionHandler(txEvent3));

    expect(findings).toStrictEqual([
      deviationFinding(CONTRACTS.get("PIP_TWO") as string, 100, 107),
      priceUpdateFinding(),
    ]);
  });

  it("should detect rely function calls", async () => {
    let findings: Finding[] = [];

    const _from = createAddress("0x5");
    const _to = CONTRACTS.get("PIP_ONE") as string;
    const _input: string = relyIface.encodeFunctionData("rely", [createAddress("0x5")]);

    const txEvent = new TestTransactionEvent()
      .setTo(_to)
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      })
      .setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));
    expect(findings).toStrictEqual([relyFinding(CONTRACTS.get("PIP_ONE") as string, createAddress("0x5"))]);
  });

  it("should detect deny function calls", async () => {
    let findings: Finding[] = [];

    const _from = createAddress("0x2");
    const _to = CONTRACTS.get("PIP_ONE") as string;
    const _input: string = denyIface.encodeFunctionData("deny", [createAddress("0x5")]);

    const txEvent = new TestTransactionEvent()
      .setTo(_to)
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      })
      .setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));
    expect(findings).toStrictEqual([denyFinding(CONTRACTS.get("PIP_ONE") as string, createAddress("0x5"))]);
  });

  it("should detect when poke was not called", async () => {
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(previousHourForActivatingAgent);
    const txEvent2 = new TestTransactionEvent().setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent1));
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([priceUpdateFinding()]);
  });

  it("should detect big price deviations", async () => {
    let findings: Finding[] = [];
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);

    const txEvent = new TestTransactionEvent()
      .addTraces({
        from: CONTRACTS.get("PIP_ONE") as string,
        input: peekFunctionSelector,
        output: peek_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [107]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_ONE") as string, log.data, ...log.topics)
      .setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));

    expect(findings).toStrictEqual([deviationFinding(CONTRACTS.get("PIP_ONE") as string, 100, 107)]);
  });

  it("should not return MakerDAO-OSM-4 finding if poke was already called in that hour", async () => {
    let findings: Finding[] = [];
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);

    const txEvent1 = new TestTransactionEvent()
      .addTraces({ to: megaPokerAddress, input: pokeFunctionSelector })
      .setTimestamp(lessThanTenMinutes);
    const txEvent2 = new TestTransactionEvent()
      .addTraces({
        from: CONTRACTS.get("PIP_ONE"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [107]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_ONE"), log.data, ...log.topics)
      .setTimestamp(greaterThanTenMinutes);

    const _from = createAddress("0x2");
    const _to = CONTRACTS.get("PIP_TWO") as string;
    const _input: string = denyIface.encodeFunctionData("deny", [createAddress("0x5")]);

    const txEvent3 = new TestTransactionEvent()
      .setTo(_to)
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      })
      .setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent1));
    findings = findings.concat(await transactionHandler(txEvent2));
    findings = findings.concat(await transactionHandler(txEvent3));

    expect(findings).toStrictEqual([
      deviationFinding(CONTRACTS.get("PIP_ONE") as string, 100, 107),
      denyFinding(CONTRACTS.get("PIP_TWO") as string, createAddress("0x5")),
    ]);
  });

  it("should update addresses on UpdateAddress, RemoveAddress events", async () => {
    const iface = new Interface(EVENTS_ABIS);
    const log = iface.encodeEventLog(iface.getEvent("UpdateAddress"), [
      formatBytes32String("PIP_FOUR"),
      createAddress("0x7"),
    ]);
    const log2 = iface.encodeEventLog(iface.getEvent("RemoveAddress"), [formatBytes32String("PIP_THREE")]);

    const wrongIface = new Interface(["event wrong()"]);
    const log3 = wrongIface.encodeEventLog(wrongIface.getEvent("wrong"), []);

    // calls updateAddresses on UpdateAddress event
    const txEvent1 = new TestTransactionEvent().addAnonymousEventLog(CHAIN_LOG, log.data, ...log.topics);
    await transactionHandler(txEvent1);
    expect(updateAddresses).toBeCalledTimes(1);

    updateAddresses.mockReset();

    // calls updateAddresses on RemoveAddress event
    const txEvent2 = new TestTransactionEvent().addAnonymousEventLog(CHAIN_LOG, log2.data, ...log2.topics);
    await transactionHandler(txEvent2);
    expect(updateAddresses).toBeCalledTimes(1);

    updateAddresses.mockReset();
    // does not call updateAddresses when the event or the contract are wrong
    const txEvent3 = new TestTransactionEvent()
      .addAnonymousEventLog(createAddress("0x3"), log2.data, ...log2.topics) // wrong contract
      .addAnonymousEventLog(CHAIN_LOG, log3.data, ...log3.topics); // wrong event
    await transactionHandler(txEvent3);
    expect(updateAddresses).toBeCalledTimes(0);
  });

  it("should ignore UpdateAddress, RemoveAddress events with no osm Contracts", async () => {
    const iface = new Interface(EVENTS_ABIS);
    const log = iface.encodeEventLog(iface.getEvent("UpdateAddress"), [
      formatBytes32String("NOPIP_FOUR"),
      createAddress("0x8"),
    ]);
    const log2 = iface.encodeEventLog(iface.getEvent("RemoveAddress"), [formatBytes32String("NOPIP_THREE")]);

    const wrongIface = new Interface(["event wrong()"]);
    const log3 = wrongIface.encodeEventLog(wrongIface.getEvent("wrong"), []);

    // calls updateAddresses on UpdateAddress event
    const txEvent1 = new TestTransactionEvent().addAnonymousEventLog(CHAIN_LOG, log.data, ...log.topics);
    await transactionHandler(txEvent1);
    expect(updateAddresses).toBeCalledTimes(0);

    updateAddresses.mockReset();

    // calls updateAddresses on RemoveAddress event
    const txEvent2 = new TestTransactionEvent().addAnonymousEventLog(CHAIN_LOG, log2.data, ...log2.topics);
    await transactionHandler(txEvent2);
    expect(updateAddresses).toBeCalledTimes(0);
  });
});
