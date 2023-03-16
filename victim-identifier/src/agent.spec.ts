import { FindingType, FindingSeverity, Finding, HandleTransaction, Label, EntityType } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { when } from "jest-when";
import { createAddress } from "forta-agent-tools";

class TestTransactionEventExtended extends TestTransactionEvent {
  constructor() {
    super();
  }

  public setFrom(address: string): TestTransactionEventExtended {
    super.setFrom(address);
    return this;
  }

  public setTo(address: string | null): TestTransactionEventExtended {
    this.transaction.to = address ? address.toLowerCase() : null;
    return this;
  }

  public setNonce(value: number): TestTransactionEventExtended {
    this.transaction.nonce = value;
    return this;
  }
}

const testCreatePreparationStageFinding = (
  preparationStageVictims: Record<
    string,
    {
      protocolUrl: string;
      protocolTwitter: string;
      tag: string;
      holders: string[];
      confidence: number;
    }
  >,
  createdContractAddresses: string[],
  txFrom: string
): Finding => {
  const labels: Label[] = [];
  let metadata: {
    [key: string]: string;
  } = {};

  createdContractAddresses.forEach((contract, index) => {
    metadata[index === 0 ? "contract" : `contract${index + 1}`] = contract;
  });

  metadata["deployer"] = txFrom;

  labels.push({
    entity: txFrom,
    entityType: EntityType.Address,
    label: "Attacker",
    confidence: 1,
    remove: false,
  });

  let index = 1;

  // Iterate through the preparationStageVictims object
  for (const contract in preparationStageVictims) {
    const { protocolUrl, protocolTwitter, tag, holders, confidence } = preparationStageVictims[contract];
    // Add properties to the metadata object, using the index as a suffix
    metadata[`address${index}`] = contract;
    metadata[`tag${index}`] = tag;
    metadata[`protocolUrl${index}`] = protocolUrl;
    metadata[`protocolTwitter${index}`] = protocolTwitter;
    /* 
      Add the victim's properties to the metadata object -
      If the number of victims is large, don't output the "holders" property to avoid
      "Cannot return more than 50kB of findings per request" error */
    if (Object.keys(preparationStageVictims).length < 4) {
      metadata[`holders${index}`] = holders.join(", ");
    }
    index++;

    // Create a label for the victim
    labels.push({
      entity: contract,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: confidence,
      remove: false,
    });
  }

  return Finding.fromObject({
    name: "Victim Identified - Preparation Stage",
    description: "A possible victim has been identified in the preparation stage of an attack",
    alertId: "VICTIM-IDENTIFIER-PREPARATION-STAGE",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata,
    labels,
  });
};

const testCreateExploitationStageFinding = (
  exploitationStageVictims: Record<
    string,
    {
      protocolUrl: string;
      protocolTwitter: string;
      tag: string;
      holders: string[];
      confidence: number;
    }
  >
): Finding => {
  const labels: Label[] = [];
  let metadata: {
    [key: string]: string;
  } = {};
  let index = 1;

  // Iterate through the exploitationStageVictims object
  for (const contract in exploitationStageVictims) {
    const victim = exploitationStageVictims[contract];
    // Add properties to the metadata object, using the index as a suffix
    metadata[`address${index}`] = contract;
    metadata[`tag${index}`] = victim.tag;
    metadata[`protocolUrl${index}`] = victim.protocolUrl;
    metadata[`protocolTwitter${index}`] = victim.protocolTwitter;
    /*
        Add the victim's properties to the metadata object -
        If the number of victims is large, don't output the "holders" property to avoid
        "Cannot return more than 50kB of findings per request" error */
    if (Object.keys(exploitationStageVictims).length < 4) {
      metadata[`holders${index}`] = victim.holders.join(", ");
    }
    index++;

    // Create a label for the victim
    labels.push({
      entity: contract,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: victim.confidence,
      remove: false,
    });
  }
  return Finding.fromObject({
    name: "Victim Identified - Exploitation Stage",
    description: "A possible victim has been identified in the exploitation stage of an attack",
    alertId: "VICTIM-IDENTIFIER-EXPLOITATION-STAGE",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata,
    labels,
  });
};

describe("Victim Identifier bot test suite", () => {
  const mockGetIdentifiedVictims = jest.fn();
  const mockVictimIdentifer = {
    getIdentifiedVictims: mockGetIdentifiedVictims,
  };
  let handleTransaction: HandleTransaction = provideHandleTransaction(mockVictimIdentifer as any);

  describe("handleTransaction", () => {
    it("returns empty findings if there are no victims", async () => {
      const mockTxEvent = new TestTransactionEvent();

      when(mockGetIdentifiedVictims)
        .calledWith(mockTxEvent)
        .mockReturnValue({ preparationStage: {}, exploitationStage: {} });

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if there is a preparation stage victim", async () => {
      const mockTxEvent: TestTransactionEventExtended = new TestTransactionEventExtended()
        .setFrom(createAddress("0x01"))
        .setTo(null)
        .setNonce(24);
      const victims = {
        preparationStage: {
          "0x0000000000000000000000000000000000011888": {
            holders: ["0x000000000000000000000000000000000022aabb", "0x0000000000000000000000000000000033aabbcc"],
            protocolTwitter: "Victim5678Twitter",
            protocolUrl: "victim5678.org",
            tag: "Victim5678",
            confidence: 1,
          },
        },
        exploitationStage: {},
      };

      when(mockGetIdentifiedVictims).calledWith(mockTxEvent).mockReturnValue(victims);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        testCreatePreparationStageFinding(
          victims.preparationStage,
          ["0x45E3929804a31Ca48C531bCba737c542Ef5352E5"],
          createAddress("0x01")
        ),
      ]);
    });

    it("returns a finding if there is an exploitation stage victim", async () => {
      const mockTxEvent = new TestTransactionEvent();
      const victims = {
        preparationStage: {},
        exploitationStage: {
          "0x0000000000000000000000000000000000012132": {
            holders: [],
            protocolTwitter: "Victim225678Twitter",
            protocolUrl: "victim225678.org",
            tag: "Victim225678",
            confidence: 0.4,
          },
        },
      };

      when(mockGetIdentifiedVictims).calledWith(mockTxEvent).mockReturnValue(victims);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([testCreateExploitationStageFinding(victims.exploitationStage)]);
    });

    it("returns a finding if there are multiple exploitation stage victims", async () => {
      const mockTxEvent = new TestTransactionEvent();
      const victims = {
        preparationStage: {},
        exploitationStage: {
          "0x0000000000000000000000000000000000012132": {
            holders: [],
            protocolTwitter: "Victim225678Twitter",
            protocolUrl: "victim225678.org",
            tag: "Victim225678",
            confidence: 0,
          },
          "0x00000000000000000000000000000000777712132": {
            holders: ["0x000000000000000000000000000000012122aabb", "0x0000000000000000000000000000000043aabbcc"],
            protocolTwitter: "",
            protocolUrl: "",
            tag: "Victim225678",
            confidence: 0.6,
          },
        },
      };

      when(mockGetIdentifiedVictims).calledWith(mockTxEvent).mockReturnValue(victims);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([testCreateExploitationStageFinding(victims.exploitationStage)]);
    });
  });

  it("returns multiple findings if there is a preparation stage and an exploitation stage victim", async () => {
    const mockTxEvent: TestTransactionEventExtended = new TestTransactionEventExtended()
      .setFrom(createAddress("0x01"))
      .setTo(null)
      .setNonce(24);
    const victims = {
      preparationStage: {
        "0x0000000000000000000000000000000000011888": {
          holders: ["0x000000000000000000000000000000000022aabb", "0x0000000000000000000000000000000033aabbcc"],
          protocolTwitter: "Victim5678Twitter",
          protocolUrl: "victim5678.org",
          tag: "Victim5678",
          confidence: 1,
        },
      },
      exploitationStage: {
        "0x0000000000000000000000000000000000012132": {
          holders: [],
          protocolTwitter: "Victim225678Twitter",
          protocolUrl: "victim225678.org",
          tag: "Victim225678",
          confidence: 0.3,
        },
      },
    };
    when(mockGetIdentifiedVictims).calledWith(mockTxEvent).mockReturnValue(victims);

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      testCreatePreparationStageFinding(
        victims.preparationStage,
        ["0x45E3929804a31Ca48C531bCba737c542Ef5352E5"],
        createAddress("0x01")
      ),
      testCreateExploitationStageFinding(victims.exploitationStage),
    ]);
  });
});
