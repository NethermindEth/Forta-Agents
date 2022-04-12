import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
  keccak256,
} from "forta-agent";
import { utils } from "ethers";
import agent from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import abi from "./abi";
import { ParamType } from "ethers/lib/utils";

enum DESC {
  ADD_STRATEGIEST = "addStrategist",
  GRANT_ROLE      = "grantRole",
  RENOUNCE_ROLE   = "renounceRole",
  REVOKE_ROLE     = "revokeRole",
};

const role = (name: string) => keccak256(name);

const createFinding = (desc: DESC, metadata: Record<string, string>) => 
  Finding.fromObject({
    name: "Ondo Finance Registry Role Change Operation",
    description: `${desc.toString()} call detected`,
    alertId: "ONDO-1",
    protocol: "ONDO",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: {
      ...metadata,
      method: desc.toString(),
    },
  });

// TODO: Improve GAM forta-agent version (Remove `as any` everywhere)
describe("Role Changes agent test suite", () => {
  const registry: string = createAddress("0xdead");
  const handler: HandleTransaction = agent.provideHandleTransaction(registry); 
  
  it("should return empty findings on empty txns", async () => {
    const txn: TransactionEvent = new TestTransactionEvent() as any;

    const findings = await handler(txn);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings on empty txns", async () => {
    const txn: TransactionEvent = new TestTransactionEvent() as any;

    const findings = await handler(txn);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple role changes emitted in the correct registry", async () => {
    const TEST_CASES: string[][] = [
      [DESC.ADD_STRATEGIEST.toString(), createAddress("0x00"), createAddress("0xdef1"), "Strategist-Role-1"],
      [DESC.GRANT_ROLE.toString()     , registry             , role("Role-1"), createAddress("0xabc01")],
      [DESC.RENOUNCE_ROLE.toString()  , createAddress("0x02"), role("Role-2"), createAddress("0xabc02")],
      [DESC.REVOKE_ROLE.toString()    , createAddress("0x03"), role("Role-3"), createAddress("0xabc03")],
      [DESC.ADD_STRATEGIEST.toString(), registry             , createAddress("0xdeade0a"), "Strategist-Role-2"],
      [DESC.GRANT_ROLE.toString()     , registry             , role("Role-4"), createAddress("0xabc04")],
      [DESC.RENOUNCE_ROLE.toString()  , createAddress("0x06"), role("Role-5"), createAddress("0xabc05")],
      [DESC.REVOKE_ROLE.toString()    , createAddress("0x07"), role("Role-6"), createAddress("0xabc06")],
      [DESC.ADD_STRATEGIEST.toString(), createAddress("0x08"), createAddress("0xfee") , "Strategist-Role-3"],
      [DESC.GRANT_ROLE.toString()     , createAddress("0x09"), role("Role-7"), createAddress("0xabc07")],
      [DESC.RENOUNCE_ROLE.toString()  , registry             , role("Role-8"), createAddress("0xabc08")],
      [DESC.REVOKE_ROLE.toString()    , registry             , role("Role-9"), createAddress("0xabc10")],
    ];

    const sender: string = createAddress("0x53d3");
    const iface: utils.Interface = new utils.Interface(abi.REGISTRY);

    const txn: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(sender) as any;

    TEST_CASES.forEach(
      ([method, contract, ...params]: string[]) =>
        txn.addTraces({
          to: contract,
          input: iface.encodeFunctionData(
            iface.getFunction(method),
            params
          ),
        })
    );

    const findings = await handler(txn as any);
    expect(findings).toStrictEqual([
      createFinding(DESC.GRANT_ROLE, {
        role: role("Role-1"),
        account: createAddress("0xabc01"),
        sender,
      }),
      createFinding(DESC.ADD_STRATEGIEST, {
        _name: "Strategist-Role-2",
        _strategist: createAddress("0xdeade0a"),
        sender,
      }),
      createFinding(DESC.GRANT_ROLE, {
        role: role("Role-4"),
        account: createAddress("0xabc04"),
        sender,
      }),
      createFinding(DESC.RENOUNCE_ROLE, {
        role: role("Role-8"),
        account: createAddress("0xabc08"),
        sender,
      }),
      createFinding(DESC.REVOKE_ROLE, {
        role: role("Role-9"),
        account: createAddress("0xabc10"),
        sender,
      }),
    ]);
  });
});
