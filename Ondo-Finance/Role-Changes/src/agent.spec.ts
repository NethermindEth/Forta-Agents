import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent, keccak256 } from "forta-agent";
import { utils } from "ethers";
import agent from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { toChecksumAddress } from "web3-utils";
import abi from "./abi";

enum DESC {
  ADD_STRATEGIEST = "addStrategist",
  GRANT_ROLE = "grantRole",
  RENOUNCE_ROLE = "renounceRole",
  REVOKE_ROLE = "revokeRole",
  NOT_REGISTRY = "notARegistryCall",
  ENABLE_TOKENS = "enableTokens",
}

const role = (name: string) => keccak256(name);

const checksumAddress = (prefix: string) =>
  toChecksumAddress(createAddress(prefix));

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

describe("Role Changes agent test suite", () => {
  const registry: string = createAddress("0xdead");
  const handler: HandleTransaction = agent.provideHandleTransaction(registry);

  it("should return empty findings on empty txns", async () => {
    const txn: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(txn);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple role changes emitted in the correct registry", async () => {
    const TEST_CASES: string[][] = [
      [DESC.ADD_STRATEGIEST.toString(), createAddress("0xe0a30"), createAddress("0x00"), createAddress("0xdef1"), "Strategist-Role-1"],
      [DESC.GRANT_ROLE.toString()     , createAddress("0xe0a20"), registry, role("Role-1"), createAddress("0xabc01")],
      [DESC.RENOUNCE_ROLE.toString()  , createAddress("0xe0a10"), createAddress("0x02"), role("Role-2"), createAddress("0xabc02")],
      [DESC.REVOKE_ROLE.toString()    , createAddress("0xe0a09"), createAddress("0x03"), role("Role-3"), createAddress("0xabc03")],
      [DESC.ADD_STRATEGIEST.toString(), createAddress("0xe0a08"), registry, createAddress("0xdeade0a"), "Strategist-Role-2"],
      [DESC.GRANT_ROLE.toString()     , createAddress("0xe0a07"), registry, role("Role-4"), createAddress("0xabc04")],
      [DESC.RENOUNCE_ROLE.toString()  , createAddress("0xe0a06"), createAddress("0x06"), role("Role-5"), createAddress("0xabc05")],
      [DESC.REVOKE_ROLE.toString()    , createAddress("0xe0a05"), createAddress("0x07"), role("Role-6"), createAddress("0xabc06")],
      [DESC.ADD_STRATEGIEST.toString(), createAddress("0xe0a04"), createAddress("0x08"), createAddress("0xfee"), "Strategist-Role-3"],
      [DESC.GRANT_ROLE.toString()     , createAddress("0xe0a03"), createAddress("0x09"), role("Role-7"), createAddress("0xabc07")],
      [DESC.RENOUNCE_ROLE.toString()  , createAddress("0xe0a02"), registry, role("Role-8"), createAddress("0xabc08")],
      [DESC.REVOKE_ROLE.toString()    , createAddress("0xe0a01"), registry, role("Role-9"), createAddress("0xabc10")],
      [DESC.NOT_REGISTRY.toString()   , createAddress("0xe0a123"), createAddress("0xdef1bad")],
      [DESC.ENABLE_TOKENS.toString()  , createAddress("0xe0a321"), registry],
    ];

    const sender: string = createAddress("0x53d3");
    const iface: utils.Interface = new utils.Interface([
      ...abi.REGISTRY,
      "function notARegistryCall()",
      "function enableTokens() external", // Real Registry method
    ]);

    const txn: TestTransactionEvent = new TestTransactionEvent().setFrom(sender);

    TEST_CASES.forEach(([method, sender, contract, ...params]: string[]) =>
      txn.addTraces({
        to: contract,
        from: sender,
        input: iface.encodeFunctionData(iface.getFunction(method), params),
      })
    );

    const findings = await handler(txn);
    expect(findings).toStrictEqual([
      createFinding(DESC.GRANT_ROLE, {
        role: role("Role-1"),
        account: checksumAddress("0xabc01"),
        sender: createAddress("0xe0a20"),
      }),
      createFinding(DESC.ADD_STRATEGIEST, {
        _name: "Strategist-Role-2",
        _strategist: checksumAddress("0xdeade0a"),
        sender: createAddress("0xe0a08"),
      }),
      createFinding(DESC.GRANT_ROLE, {
        role: role("Role-4"),
        account: checksumAddress("0xabc04"),
        sender: createAddress("0xe0a07"),
      }),
      createFinding(DESC.RENOUNCE_ROLE, {
        role: role("Role-8"),
        account: checksumAddress("0xabc08"),
        sender: createAddress("0xe0a02"),
      }),
      createFinding(DESC.REVOKE_ROLE, {
        role: role("Role-9"),
        account: checksumAddress("0xabc10"),
        sender: createAddress("0xe0a01"),
      }),
    ]);
  });
});
