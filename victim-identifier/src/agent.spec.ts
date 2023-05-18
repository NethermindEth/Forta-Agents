import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  Label,
  EntityType,
  getEthersProvider,
  createTransactionEvent,
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { when } from "jest-when";
import { VictimIdentifier, createAddress } from "forta-agent-tools";
import { keys } from "./keys";

jest.setTimeout(500000);
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
    metadata: {},
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
      metadata: {},
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
      metadata: {},
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
    it.only("tests performance", async () => {
      const realProvider = getEthersProvider();
      const handleRealTransaction = provideHandleTransaction(new VictimIdentifier(realProvider, keys));

      // ------ Exploitation stage attack ------
      const exploitationStageTxReceipt = await realProvider.getTransactionReceipt(
        "0x4134c0d3351881823b4b4364a60c51dcebbc185786ab702c4ef74d8f9eeab042"
      );

      const exploitationStageTx = await realProvider.getTransaction(
        "0x4134c0d3351881823b4b4364a60c51dcebbc185786ab702c4ef74d8f9eeab042"
      );

      // Lowercase all addresses in logs to match the real txEvent logs
      const lowerCaseLogs = exploitationStageTxReceipt.logs.map((log) => {
        return {
          ...log,
          address: log.address.toLowerCase(),
        };
      });

      const exploitationTxEvent = createTransactionEvent({
        transaction: {
          hash: exploitationStageTxReceipt.transactionHash,
          from: exploitationStageTxReceipt.from.toLowerCase(),
          to: exploitationStageTxReceipt.to.toLowerCase(),
          nonce: exploitationStageTx.nonce,
          data: exploitationStageTx.data,
          gas: "1",
          gasPrice: exploitationStageTx.gasPrice!.toString(),
          value: "0x0",
          r: exploitationStageTx.r!,
          s: exploitationStageTx.s!,
          v: exploitationStageTx.v!.toFixed(),
        },
        block: {
          number: exploitationStageTxReceipt.blockNumber,
          hash: exploitationStageTxReceipt.blockHash,
          timestamp: 1684408535,
        },
        logs: lowerCaseLogs,
        contractAddress: null,
      });

      // ------ Preparation stage attack ------
      const preparationStageTxReceipt = await realProvider.getTransactionReceipt(
        "0x47260a3d2c2ff5f7500feeedac8891b63f24a7a72be1cadf30c37110c7fe94ca"
      );

      const preparationStageTx = await realProvider.getTransaction(
        "0x47260a3d2c2ff5f7500feeedac8891b63f24a7a72be1cadf30c37110c7fe94ca"
      );

      // Lowercase all addresses in logs to match the real txEvent logs
      const lowerCaseLogs2 = preparationStageTxReceipt.logs.map((log) => {
        return {
          ...log,
          address: log.address.toLowerCase(),
        };
      });

      const preparationStageTxEvent = createTransactionEvent({
        transaction: {
          hash: preparationStageTxReceipt.transactionHash,
          from: preparationStageTxReceipt.from.toLowerCase(),
          to: null,
          nonce: preparationStageTx.nonce,
          data: preparationStageTx.data,
          gas: "1",
          gasPrice: preparationStageTx.gasPrice!.toString(),
          value: "0x0",
          r: preparationStageTx.r!,
          s: preparationStageTx.s!,
          v: preparationStageTx.v!.toFixed(),
        },
        block: {
          number: preparationStageTxReceipt.blockNumber,
          hash: preparationStageTxReceipt.blockHash,
          timestamp: 1684408535,
        },
        logs: lowerCaseLogs2,
        contractAddress: null,
      });

      // ------ Normal Transaction ------
      const normalTxReceipt = await realProvider.getTransactionReceipt(
        "0x1de511c1cbe1cbda7051780de06b337c4cd211ef3801d4b46c79d2102e6a1143"
      );

      const normalTx = await realProvider.getTransaction(
        "0x1de511c1cbe1cbda7051780de06b337c4cd211ef3801d4b46c79d2102e6a1143"
      );

      // Lowercase all addresses in logs to match the real txEvent logs
      const lowerCaseLogs3 = normalTxReceipt.logs.map((log) => {
        return {
          ...log,
          address: log.address.toLowerCase(),
        };
      });

      const normalTxEvent = createTransactionEvent({
        transaction: {
          hash: normalTxReceipt.transactionHash,
          from: normalTxReceipt.from.toLowerCase(),
          to: normalTxReceipt.to.toLowerCase(),
          nonce: normalTx.nonce,
          data: normalTx.data,
          gas: "1",
          gasPrice: normalTx.gasPrice!.toString(),
          value: "0x0",
          r: normalTx.r!,
          s: normalTx.s!,
          v: normalTx.v!.toFixed(),
        },
        block: {
          number: normalTxReceipt.blockNumber,
          hash: normalTxReceipt.blockHash,
          timestamp: 1684408535,
        },
        logs: lowerCaseLogs3,
        contractAddress: null,
      });

      //     Chain: Blocktime, Number of Tx -> Avg processing time in ms target
      //     Ethereum: 12s, 150 -> 80ms
      //     BSC: 3s, 70 -> 43ms
      //     Polygon: 2s, 50 -> 40ms
      //     Avalanche: 2s, 5 -> 400ms
      //     Arbitrum: 1s, 5 -> 200ms
      //     Optimism: 24s, 150 -> 160ms
      //     Fantom: 1s, 5 -> 200ms

      //      local testing reveals an avg processing time of 500, which results in the following sharding config:
      //      Ethereum: 12s, 150 -> 80ms - 7
      //      BSC: 3s, 70 -> 43ms - 12
      //      Polygon: 2s, 50 -> 40ms - 13
      //      Avalanche: 2s, 5 -> 400ms - 2
      //      Arbitrum: 1s, 5 -> 200ms - 3
      //      Optimism: 24s, 150 -> 160ms - 4
      //      Fantom: 1s, 5 -> 200ms - 3

      const processingRuns = 15;
      let totalTimeExploitationStageAttack = 0;
      let totalTimePreparationStageAttack = 0;
      let totalTimeNormalTx = 0;
      for (let i = 0; i < processingRuns; i++) {
        const startTimeExploitationStageAttack = performance.now();
        await handleRealTransaction(exploitationTxEvent);
        const endTimeExploitationStageAttack = performance.now();
        totalTimeExploitationStageAttack += endTimeExploitationStageAttack - startTimeExploitationStageAttack;

        const startTimePreparationStageAttack = performance.now();
        await handleRealTransaction(preparationStageTxEvent);
        const endTimePreparationStageAttack = performance.now();
        totalTimePreparationStageAttack += endTimePreparationStageAttack - startTimePreparationStageAttack;

        const startTimeNormalTx = performance.now();
        await handleRealTransaction(normalTxEvent);
        const endTimeNormalTx = performance.now();
        totalTimeNormalTx += endTimeNormalTx - startTimeNormalTx;
      }
      const processingTimeExploitationStage = totalTimeExploitationStageAttack / processingRuns;
      const processingTimePreparationStage = totalTimePreparationStageAttack / processingRuns;
      const processingTimeNormalTx = totalTimeNormalTx / processingRuns;
      console.log(
        (processingTimeExploitationStage * 0.07 +
          processingTimePreparationStage * 0.01 +
          processingTimeNormalTx * 0.92) /
          3
      );
      expect(
        (processingTimeExploitationStage * 0.07 +
          processingTimePreparationStage * 0.01 +
          processingTimeNormalTx * 0.92) /
          3
      ).toBeLessThan(500);
    });

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
