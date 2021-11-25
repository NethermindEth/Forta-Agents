import { Finding, HandleTransaction } from "forta-agent";
import { provideAgentHandler } from "./agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools";
import Web3 from "web3";
import { createFinding as deviationFinding } from "./big.queued.price.deviation";
import { createFinding as priceUpdateFinding } from "./price.update.check";
import { createFinding as relyFinding } from "./rely.function.spec";
import { createFinding as denyFinding } from "./deny.function.spec";


const addresses: string[] = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
];
const testAddresses: any = { get: () => addresses};

const megaPokerAddress = "0x2417c2762ec12f2696f62cfa5492953b9467dc81";

const pokeFunctionSelector = "0x18178358";
const peekFunctionSelector = "0x59e02dd7";

const previousHourForActivatingAgent = 1467018381;
const lessThanTenMinutes = 1467021981; // "Mon, 27 Jun 2016 10:06:21 GMT"
const greaterThanTenMinutes = 1467022981; // "Mon, 27 Jun 2016 10:23:01 GMT"

const web3: Web3 = new Web3();

describe("OSM Agent Test Suite", () => {
  let transactionHandler: HandleTransaction;

  it("should returns empty findings is not expected events happens", async () => {
    let findings: Finding[] = [];
    transactionHandler = provideAgentHandler(testAddresses);

    const txEvent = new TestTransactionEvent().setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));

    expect(findings).toStrictEqual([]);
  });

  it("should returns findings from multiple handlers", async () => {
    let findings: Finding[] = [];
    transactionHandler = provideAgentHandler(testAddresses);

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent3 = new TestTransactionEvent()
      .setTimestamp(greaterThanTenMinutes)
      .addTraces({
        from: addresses[0],
        input: peekFunctionSelector,
        output: web3.eth.abi.encodeParameters(["uint256", "bool"], [107, true]),
      })
      .addEventLog(
        "LogValue(bytes32)",
        addresses[0],
        web3.eth.abi.encodeParameter("uint128", 100)
      );

    findings = findings.concat(await transactionHandler(txEvent1));
    findings = findings.concat(await transactionHandler(txEvent2));
    findings = findings.concat(await transactionHandler(txEvent3));

    expect(findings).toStrictEqual([
      deviationFinding(addresses[0], BigInt(100), BigInt(107)),
      priceUpdateFinding(),
    ]);
  });

  it("should detects rely event", async () => {
    let findings: Finding[] = [];
    transactionHandler = provideAgentHandler(testAddresses);

    const _from = createAddress("0x5");
    const _to = addresses[0];
    const _input: string = web3.eth.abi.encodeFunctionCall(
      {
        name: "rely",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "usr",
          },
        ],
      },
      [createAddress("0x5")]
    );

    const txEvent = new TestTransactionEvent()
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      })
      .setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));
    expect(findings).toStrictEqual([
      relyFinding(addresses[0], createAddress("0x5")),
    ]);
  });

  it("should detect deny function", async () => {
    let findings: Finding[] = [];
    transactionHandler = provideAgentHandler(testAddresses);

    const _from = createAddress("0x2");
    const _to = addresses[0];
    const _input: string = web3.eth.abi.encodeFunctionCall(
      {
        name: "deny",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "_operator",
          },
        ],
      },
      [createAddress("0x5")]
    );

    const txEvent = new TestTransactionEvent()
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      })
      .setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));
    expect(findings).toStrictEqual([
      denyFinding(addresses[0], createAddress("0x5")),
    ]);
  });

  it("should detects when poke was not called", async () => {
    let findings: Finding[] = [];
    transactionHandler = provideAgentHandler(testAddresses);

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinutes
    );

    findings = findings.concat(await transactionHandler(txEvent1));
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([priceUpdateFinding()]);
  });

  it("should detects big price deviations", async () => {
    let findings: Finding[] = [];
    transactionHandler = provideAgentHandler(testAddresses);

    const txEvent = new TestTransactionEvent()
      .addTraces({
        from: addresses[0],
        input: peekFunctionSelector,
        output: web3.eth.abi.encodeParameters(["uint256", "bool"], [107, true]),
      })
      .addEventLog(
        "LogValue(bytes32)",
        addresses[0],
        web3.eth.abi.encodeParameter("uint128", 100)
      )
      .setTimestamp(lessThanTenMinutes);

    findings = findings.concat(await transactionHandler(txEvent));

    expect(findings).toStrictEqual([
      deviationFinding(addresses[0], BigInt(100), BigInt(107)),
    ]);
  });

  it("should not return MakerDAO-OSM-4 finding if poke was already called in that hour", async () => {
    let findings: Finding[] = [];
    transactionHandler = provideAgentHandler(testAddresses);

    const txEvent1 = new TestTransactionEvent()
      .addTraces({ to: megaPokerAddress, input: pokeFunctionSelector })
      .setTimestamp(lessThanTenMinutes);
    const txEvent2 = new TestTransactionEvent()
      .addTraces({
        from: addresses[0],
        input: peekFunctionSelector,
        output: web3.eth.abi.encodeParameters(["uint256", "bool"], [107, true]),
      })
      .addEventLog(
        "LogValue(bytes32)",
        addresses[0],
        web3.eth.abi.encodeParameter("uint128", 100)
      )
      .setTimestamp(greaterThanTenMinutes);

    const _from = createAddress("0x2");
    const _to = addresses[0];
    const _input: string = web3.eth.abi.encodeFunctionCall(
      {
        name: "deny",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "_operator",
          },
        ],
      },
      [createAddress("0x5")]
    );

    const txEvent3 = new TestTransactionEvent()
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
      deviationFinding(addresses[0], BigInt(100), BigInt(107)),
      denyFinding(addresses[0], createAddress("0x5")),
    ]);
  });
});
