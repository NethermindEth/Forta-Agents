import { HandleTransaction } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools";
import { providerHandleTransaction, createFinding } from "./agent";
import { gaugeInterface } from "./abi";

const curveDAOAddress = createAddress("0x1");

describe("Curve DAO Kill a Gauge Test Suite", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = providerHandleTransaction(curveDAOAddress);
  });

  it("should return empty findings method was not called", async () => {
    const txEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding method set_killed was called from DAO", async () => {
    const gaugeAddress = createAddress("0x2");

    const txEvent = new TestTransactionEvent().addTraces({
      to: gaugeAddress,
      from: curveDAOAddress,
      input: gaugeInterface.encodeFunctionData("set_killed", [true]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding({ to: gaugeAddress })]);
  });

  it("should return empty findings if method set_killed was called for not killing", async () => {
    const gaugeAddress = createAddress("0x2");

    const txEvent = new TestTransactionEvent().addTraces({
      to: gaugeAddress,
      from: curveDAOAddress,
      input: gaugeInterface.encodeFunctionData("set_killed", [false]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if method set_killed is not called from DAO", async () => {
    const gaugeAddress = createAddress("0x2");

    const txEvent = new TestTransactionEvent().addTraces({
      to: gaugeAddress,
      from: createAddress("0x3"),
      input: gaugeInterface.encodeFunctionData("set_killed", [true]),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect multiple kill attempts", async () => {
    const gaugeAddress1 = createAddress("0x2");
    const gaugeAddress2 = createAddress("0x3");

    const txEvent = new TestTransactionEvent()
      .addTraces({
        to: gaugeAddress1,
        from: curveDAOAddress,
        input: gaugeInterface.encodeFunctionData("set_killed", [true]),
      })
      .addTraces({
        to: gaugeAddress2,
        from: curveDAOAddress,
        input: gaugeInterface.encodeFunctionData("set_killed", [true]),
      });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding({ to: gaugeAddress1 }),
      createFinding({ to: gaugeAddress2 }),
    ]);
  });
});
