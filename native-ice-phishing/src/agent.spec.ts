import {
  Alert,
  EntityType,
  Finding,
  FindingSeverity,
  FindingType,
  HandleBlock,
  HandleTransaction,
  Label,
  createTransactionEvent,
  ethers,
  getAlerts,
  getEthersProvider,
} from "forta-agent";
import {
  TestTransactionEvent,
  MockEthersProvider,
  TestBlockEvent,
} from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import {
  provideInitialize,
  provideHandleTransaction,
  provideHandleBlock,
  BOT_ID,
} from "./agent";
import { when } from "jest-when";
import calculateAlertRate, { ScanCountType } from "bot-alert-rate";
import { Data, Transfer, WITHDRAW_SIG } from "./utils";
import DataFetcher from "./fetcher";
import { keys } from "./keys";
import { PersistenceHelper } from "./persistence.helper";

jest.setTimeout(400000);

const REAL_DATABASE_URL = "https://research.forta.network/database/bot/";
const REAL_DATABASE_OBJECT_KEYS = {
  transfersKey: "nm-native-icephishing-bot-objects-v7",
  alertedAddressesKey: "nm-native-icephishing-bot-objects-v2-alerted",
  alertedAddressesCriticalKey:
    "nm-native-icephishing-bot-objects-v3-alerted-critical",
};

let mockStoredData: Data = {
  nativeTransfers: {},
  alertedAddresses: [],
  alertedHashes: [],
  alertedAddressesCritical: [],
};

const testCreateFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number,
  severity: FindingSeverity
): Finding => {
  const [alertId, confidence, wording] =
    severity === FindingSeverity.Medium
      ? ["NIP-1", 0.9, "funds"]
      : ["NIP-2", 0.6, "transaction"];

  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent ${wording} to ${to} with ${funcSig} as input data`,
    alertId,
    severity,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victim: from,
      funcSig,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence,
        remove: false,
      }),
    ],
  });
};

const testCreateLowSeverityFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent funds to ${to} with ${funcSig} as input data`,
    alertId: "NIP-3",
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victim: from,
      funcSig,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.6,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence: 0.6,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.6,
        remove: false,
      }),
    ],
  });
};

const testCreateHighSeverityFinding = (
  to: string,
  anomalyScore: number,
  nativeTransfers: Transfer[]
): Finding => {
  const metadata: { [key: string]: string } = {
    attacker: to,
    anomalyScore: anomalyScore.toString(),
  };

  const labels: Label[] = [
    Label.fromObject({
      entity: to,
      entityType: EntityType.Address,
      label: "Attacker",
      confidence: 0.5,
      remove: false,
    }),
  ];

  nativeTransfers.forEach((transfer, index) => {
    const victimName = `victim${index + 1}`;
    metadata[victimName] = transfer.from;

    const victimLabel = Label.fromObject({
      entity: transfer.from,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.5,
      remove: false,
    });
    labels.push(victimLabel);
  });

  return Finding.fromObject({
    name: "Possible native ice phishing attack",
    description: `${to} received native tokens from 8+ different addresses`,
    alertId: "NIP-4",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata,
    labels,
  });
};

const testCreateCriticalSeverityFinding = (
  txHash: string,
  attacker: string,
  address: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Contract deployed with characteristics indicative of a potential native ice phishing attack",
    description: `${attacker} created contract with address ${address} to be possibly used in a native ice phishing attack`,
    alertId: "NIP-5",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      attacker,
      address,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.9,
        remove: false,
      }),
      Label.fromObject({
        entity: attacker,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
    ],
  });
};

const testCreateWithdrawalFinding = (
  txHash: string,
  attacker: string,
  address: string,
  receiver: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Withdrawal transaction in a possible native ice phishing attack",
    description: `${attacker} called withdraw function in contract: ${address} possibly used for a native ice phishing attack`,
    alertId: "NIP-6",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      attacker,
      address,
      receiver,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.9,
        remove: false,
      }),
      Label.fromObject({
        entity: attacker,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
      Label.fromObject({
        entity: receiver,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
    ],
  });
};

const testCreateCriticalNIPSeverityFinding = (
  attacker: string,
  victims: string[],
  anomalyScore: number
): Finding => {
  const metadata: { [key: string]: string } = {
    attacker,
    anomalyScore: anomalyScore.toString(),
  };

  const labels: Label[] = [
    Label.fromObject({
      entity: attacker,
      entityType: EntityType.Address,
      label: "Attacker",
      confidence: 0.8,
      remove: false,
    }),
  ];

  victims.forEach((victim, index) => {
    const victimName = `victim${index + 1}`;
    metadata[victimName] = victim;

    const victimLabel = Label.fromObject({
      entity: victim,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.8,
      remove: false,
    });
    labels.push(victimLabel);
  });

  return Finding.fromObject({
    name: "Native Ice Phishing Attack",
    description: `${attacker} received native tokens from 8+ different addresses, with no other interactions with the victims for a week`,
    alertId: "NIP-7",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata,
    labels,
  });
};

const mockFetcher = {
  isEoa: jest.fn(),
  getCode: jest.fn(),
  getSignature: jest.fn(),
  getTransactions: jest.fn(),
  getNonce: jest.fn(),
  getFunctions: jest.fn(),
  getEvents: jest.fn(),
  getAddressInfo: jest.fn(),
  getAddresses: jest.fn(),
  getLabel: jest.fn(),
  getSourceCode: jest.fn(),
  getOwner: jest.fn(),
  getNumberOfLogs: jest.fn(),
  hasValidEntries: jest.fn(),
  isValueUnique: jest.fn(),
  isRecentlyInvolvedInTransfer: jest.fn(),
  haveInteractedAgain: jest.fn(),
};
const mockGetAlerts = jest.fn();
const mockCalculateRate = jest.fn();
const mockPersistenceHelper = {
  persist: jest.fn(),
  load: jest.fn(),
};
const mockDatabaseObjectKeys = {
  transfersKey: "mock-nm-native-icephishing-bot-objects-v1",
  alertedAddressesKey: "mock-nm-native-icephishing-bot-objects-v1-alerted",
  alertedAddressesCriticalKey:
    "mock-nm-native-icephishing-bot-objects-v1-alerted-critical",
};

describe("Native Ice Phishing Bot test suite", () => {
  let initialize;
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  beforeEach(async () => {
    initialize = provideInitialize(
      mockProvider as any,
      mockPersistenceHelper as any,
      mockStoredData,
      mockDatabaseObjectKeys,
      mockGetAlerts
    );
    mockProvider.setNetwork(1);
    mockPersistenceHelper.load
      .mockReturnValueOnce({})
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    mockGetAlerts.mockReturnValue({
      alerts: [],
      pageInfo: {
        hasNextPage: false,
      },
    });

    await initialize();

    handleTransaction = provideHandleTransaction(
      mockFetcher as any,
      mockProvider as any,
      mockPersistenceHelper as any,
      mockDatabaseObjectKeys,
      mockCalculateRate,
      mockStoredData
    );
  });

  it("tests performance", async () => {
    const realProvider = getEthersProvider();
    const realInitialize = provideInitialize(
      realProvider,
      new PersistenceHelper(REAL_DATABASE_URL),
      mockStoredData,
      REAL_DATABASE_OBJECT_KEYS,
      getAlerts
    );
    await realInitialize();

    const handleRealTransaction = provideHandleTransaction(
      new DataFetcher(realProvider, keys),
      realProvider,
      new PersistenceHelper(REAL_DATABASE_URL),
      REAL_DATABASE_OBJECT_KEYS,
      calculateAlertRate,
      mockStoredData
    );

    const nativeTransferTxReceipt = await realProvider.getTransactionReceipt(
      "0xa8d52384592460c6a34ab0c08f17370f628e49d11f6f017ae22ea6ae1cb29b46"
    );

    const nativeTransferTx = await realProvider.getTransaction(
      "0xa8d52384592460c6a34ab0c08f17370f628e49d11f6f017ae22ea6ae1cb29b46"
    );

    const nativeTransferTxEvent = createTransactionEvent({
      transaction: {
        hash: nativeTransferTxReceipt.transactionHash,
        from: nativeTransferTxReceipt.from.toLowerCase(),
        to: nativeTransferTxReceipt.to.toLowerCase(),
        nonce: nativeTransferTx.nonce,
        data: nativeTransferTx.data,
        gas: "1",
        gasPrice: nativeTransferTx.gasPrice!.toString(),
        value: "0x1bbd9addfa6d0d4",
        r: nativeTransferTx.r!,
        s: nativeTransferTx.s!,
        v: nativeTransferTx.v!.toFixed(),
      },
      block: {
        number: nativeTransferTxReceipt.blockNumber,
        hash: nativeTransferTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: [],
      contractAddress: null,
    });

    const suspiciousNativeTransferTxReceipt =
      await realProvider.getTransactionReceipt(
        "0x5f53677abb9b2dedc24e81b65ba8bd782afedca4b55a4e2adae41bb19dce9c20"
      );

    const suspiciousNativeTransferTx = await realProvider.getTransaction(
      "0x5f53677abb9b2dedc24e81b65ba8bd782afedca4b55a4e2adae41bb19dce9c20"
    );

    const suspiciousNativeTransferTxEvent = createTransactionEvent({
      transaction: {
        hash: suspiciousNativeTransferTxReceipt.transactionHash,
        from: suspiciousNativeTransferTxReceipt.from.toLowerCase(),
        to: suspiciousNativeTransferTxReceipt.to.toLowerCase(),
        nonce: suspiciousNativeTransferTx.nonce,
        data: suspiciousNativeTransferTx.data,
        gas: "1",
        gasPrice: suspiciousNativeTransferTx.gasPrice!.toString(),
        value: "0xbafd6024f843",
        r: suspiciousNativeTransferTx.r!,
        s: suspiciousNativeTransferTx.s!,
        v: suspiciousNativeTransferTx.v!.toFixed(),
      },
      block: {
        number: suspiciousNativeTransferTxReceipt.blockNumber,
        hash: suspiciousNativeTransferTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: [],
      contractAddress: null,
    });

    const socialEngineeringEoaTxReceipt =
      await realProvider.getTransactionReceipt(
        "0x546d0c486b22590fe34ba7a8bf0896929fb4d9659fe130f2e0113e9fad45f4ad"
      );

    const socialEngineeringEoaTx = await realProvider.getTransaction(
      "0x546d0c486b22590fe34ba7a8bf0896929fb4d9659fe130f2e0113e9fad45f4ad"
    );

    const socialEngineeringEoaTxEvent = createTransactionEvent({
      transaction: {
        hash: socialEngineeringEoaTxReceipt.transactionHash,
        from: socialEngineeringEoaTxReceipt.from.toLowerCase(),
        to: socialEngineeringEoaTxReceipt.to.toLowerCase(),
        nonce: socialEngineeringEoaTx.nonce,
        data: socialEngineeringEoaTx.data,
        gas: "1",
        gasPrice: socialEngineeringEoaTx.gasPrice!.toString(),
        value: "0x0",
        r: socialEngineeringEoaTx.r!,
        s: socialEngineeringEoaTx.s!,
        v: socialEngineeringEoaTx.v!.toFixed(),
      },
      block: {
        number: socialEngineeringEoaTxReceipt.blockNumber,
        hash: socialEngineeringEoaTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: [],
      contractAddress: null,
    });

    const socialEngineeringContractTxReceipt =
      await realProvider.getTransactionReceipt(
        "0xe9fc809faa5b00555554baa623e3ebaee697f515983be1b1b67e5a8c603df35a"
      );

    const socialEngineeringContractTx = await realProvider.getTransaction(
      "0xe9fc809faa5b00555554baa623e3ebaee697f515983be1b1b67e5a8c603df35a"
    );

    const socialEngineeringContractTxEvent = createTransactionEvent({
      transaction: {
        hash: socialEngineeringContractTxReceipt.transactionHash,
        from: socialEngineeringContractTxReceipt.from.toLowerCase(),
        to: socialEngineeringContractTxReceipt.to.toLowerCase(),
        nonce: socialEngineeringContractTx.nonce,
        data: socialEngineeringContractTx.data,
        gas: "1",
        gasPrice: socialEngineeringContractTx.gasPrice!.toString(),
        value: "0x2e1a8be6b991436",
        r: socialEngineeringContractTx.r!,
        s: socialEngineeringContractTx.s!,
        v: socialEngineeringContractTx.v!.toFixed(),
      },
      block: {
        number: socialEngineeringContractTxReceipt.blockNumber,
        hash: socialEngineeringContractTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: [],
      contractAddress: null,
    });

    const ownerWithdrawalTxReceipt = await realProvider.getTransactionReceipt(
      "0xc794fc867030f4402da18848578255142840fdcd71bfccc2b3a333090bc82fcf"
    );

    const ownerWithdrawalTx = await realProvider.getTransaction(
      "0xc794fc867030f4402da18848578255142840fdcd71bfccc2b3a333090bc82fcf"
    );

    const ownerWithdrawalTxEvent = createTransactionEvent({
      traces: [
        {
          action: {
            callType: "call",
            to: "0x4034964d809452a803b8151c4c9843e3282b936f",
            input:
              "0x12514bba0000000000000000000000000000000000000000000000000000000000000000",
            from: "0xd9da38c311f0425bc104a0c8fef2a2e24deeb13e",
            value: "0x0",
            init: "undefined",
            address: "undefined",
            balance: "undefined",
            refundAddress: "undefined",
          },
          blockHash:
            "0x6a23a78f5e4dd4f7d9a35c2729c4318c6246ffcbdccf7f80cf176581a48de5f7",
          blockNumber: 17314214,
          result: {
            gasUsed: "0x2558",
            address: "undefined",
            code: "undefined",
            output: "0x",
          },
          subtraces: 1,
          traceAddress: [],
          transactionHash:
            "0xc794fc867030f4402da18848578255142840fdcd71bfccc2b3a333090bc82fcf",
          transactionPosition: 72,
          type: "call",
          error: "undefined",
        },
        {
          action: {
            callType: "call",
            to: "0xd9da38c311f0425bc104a0c8fef2a2e24deeb13e",
            input: "0x",
            from: "0x4034964d809452a803b8151c4c9843e3282b936f",
            value: "0x4e7d605039585d4",
            init: "undefined",
            address: "undefined",
            balance: "undefined",
            refundAddress: "undefined",
          },
          blockHash:
            "0x6a23a78f5e4dd4f7d9a35c2729c4318c6246ffcbdccf7f80cf176581a48de5f7",
          blockNumber: 17314214,
          result: {
            gasUsed: "0x0",
            address: "undefined",
            code: "undefined",
            output: "0x",
          },
          subtraces: 0,
          traceAddress: [0],
          transactionHash:
            "0xc794fc867030f4402da18848578255142840fdcd71bfccc2b3a333090bc82fcf",
          transactionPosition: 72,
          type: "call",
          error: "undefined",
        },
      ],
      transaction: {
        hash: ownerWithdrawalTxReceipt.transactionHash,
        from: ownerWithdrawalTxReceipt.from.toLowerCase(),
        to: ownerWithdrawalTxReceipt.to.toLowerCase(),
        nonce: ownerWithdrawalTx.nonce,
        data: ownerWithdrawalTx.data,
        gas: "1",
        gasPrice: ownerWithdrawalTx.gasPrice!.toString(),
        value: "0x0",
        r: ownerWithdrawalTx.r!,
        s: ownerWithdrawalTx.s!,
        v: ownerWithdrawalTx.v!.toFixed(),
      },
      block: {
        number: ownerWithdrawalTxReceipt.blockNumber,
        hash: ownerWithdrawalTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: [],
      contractAddress: null,
    });

    const phishingContractDeploymentTxReceipt =
      await realProvider.getTransactionReceipt(
        "0x93da8a297dc5561f5373b618a9de9368b03da51babf8a82b0b8c92d659a4830e"
      );

    const phishingContractDeploymentTx = await realProvider.getTransaction(
      "0x93da8a297dc5561f5373b618a9de9368b03da51babf8a82b0b8c92d659a4830e"
    );

    const phishingContractDeploymentTxEvent = createTransactionEvent({
      traces: [
        {
          action: {
            callType: "undefined",
            to: "undefined",
            input: "undefined",
            from: "0x060e1cd1652900b4536e14c0bb609f61d96ec9c5",
            value: "0x0",
            init: "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061023b806100606000396000f300608060405260043610610062576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806312065fe0146100675780633158952e146100925780633ccfd60b1461009c578063893d20e8146100b3575b600080fd5b34801561007357600080fd5b5061007c61010a565b6040518082815260200191505060405180910390f35b61009a610129565b005b3480156100a857600080fd5b506100b161012b565b005b3480156100bf57600080fd5b506100c86101e6565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60003073ffffffffffffffffffffffffffffffffffffffff1631905090565b565b3373ffffffffffffffffffffffffffffffffffffffff166000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614151561018657600080fd5b3373ffffffffffffffffffffffffffffffffffffffff166108fc3073ffffffffffffffffffffffffffffffffffffffff16319081150290604051600060405180830381858888f193505050501580156101e3573d6000803e3d6000fd5b50565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050905600a165627a7a72305820b55c1d463cd6e40fb05e74980dcc4e6bb183e5dc9fe55bba4e90a46c120634c60029",
            address: "undefined",
            balance: "undefined",
            refundAddress: "undefined",
          },
          blockHash:
            "0xbc1fa4eedb6f0f74f8bea954afc5ed589a6dbfe17a3879d9cdbdb430948e8439",
          blockNumber: 17312521,
          result: {
            gasUsed: "0x2154d",
            address: "0x8645d3b0109ea77db39f14a5496c11d181aed604",
            code: "0x608060405260043610610062576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806312065fe0146100675780633158952e146100925780633ccfd60b1461009c578063893d20e8146100b3575b600080fd5b34801561007357600080fd5b5061007c61010a565b6040518082815260200191505060405180910390f35b61009a610129565b005b3480156100a857600080fd5b506100b161012b565b005b3480156100bf57600080fd5b506100c86101e6565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60003073ffffffffffffffffffffffffffffffffffffffff1631905090565b565b3373ffffffffffffffffffffffffffffffffffffffff166000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614151561018657600080fd5b3373ffffffffffffffffffffffffffffffffffffffff166108fc3073ffffffffffffffffffffffffffffffffffffffff16319081150290604051600060405180830381858888f193505050501580156101e3573d6000803e3d6000fd5b50565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050905600a165627a7a72305820b55c1d463cd6e40fb05e74980dcc4e6bb183e5dc9fe55bba4e90a46c120634c60029",
            output: "undefined",
          },
          subtraces: 0,
          traceAddress: [],
          transactionHash:
            "0x93da8a297dc5561f5373b618a9de9368b03da51babf8a82b0b8c92d659a4830e",
          transactionPosition: 146,
          type: "create",
          error: "undefined",
        },
      ],
      transaction: {
        hash: phishingContractDeploymentTxReceipt.transactionHash,
        from: phishingContractDeploymentTxReceipt.from.toLowerCase(),
        to: null,
        nonce: phishingContractDeploymentTx.nonce,
        data: phishingContractDeploymentTx.data,
        gas: "1",
        gasPrice: phishingContractDeploymentTx.gasPrice!.toString(),
        value: "0x0",
        r: phishingContractDeploymentTx.r!,
        s: phishingContractDeploymentTx.s!,
        v: phishingContractDeploymentTx.v!.toFixed(),
      },
      block: {
        number: phishingContractDeploymentTxReceipt.blockNumber,
        hash: phishingContractDeploymentTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: [],
      contractAddress: null,
    });

    // E.g. ERC20 transfer
    const otherTxReceipt = await realProvider.getTransactionReceipt(
      "0x566d2409168739da54674b08e6e13e52d440aa8e55a2edbf00bbe7e73ea85f26"
    );

    const otherTx = await realProvider.getTransaction(
      "0x566d2409168739da54674b08e6e13e52d440aa8e55a2edbf00bbe7e73ea85f26"
    );

    // Lowercase all addresses in logs to match the real txEvent logs
    const lowerCaseLogs = otherTxReceipt.logs.map((log) => {
      return {
        ...log,
        address: log.address.toLowerCase(),
      };
    });

    const otherTxEvent = createTransactionEvent({
      transaction: {
        hash: otherTxReceipt.transactionHash,
        from: otherTxReceipt.from.toLowerCase(),
        to: otherTxReceipt.to.toLowerCase(),
        nonce: otherTx.nonce,
        data: otherTx.data,
        gas: "1",
        gasPrice: otherTx.gasPrice!.toString(),
        value: "0x0",
        r: otherTx.r!,
        s: otherTx.s!,
        v: otherTx.v!.toFixed(),
      },
      block: {
        number: otherTxReceipt.blockNumber,
        hash: otherTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: lowerCaseLogs,
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

    //      local testing reveals an avg processing time of 320, which results in the following sharding config:
    //      Ethereum: 12s, 150 -> 80ms - 4
    //      BSC: 3s, 70 -> 43ms - 8
    //      Polygon: 2s, 50 -> 40ms - 8
    //      Avalanche: 2s, 5 -> 400ms - 1
    //      Arbitrum: 1s, 5 -> 200ms - 2
    //      Optimism: 24s, 150 -> 160ms - 2
    //      Fantom: 1s, 5 -> 200ms - 2

    const processingRuns = 15;

    let totalTimeOtherTx = 0;
    let totalTimeNativeTransferTx = 0;
    let totalTimeSuspiciousNativeTransferTx = 0;
    let totalTimePhishingContractDeploymentTx = 0;
    let totalTimeOwnerWithdrawalTx = 0;
    let totalTimeSocialEngineeringEoaTx = 0;
    let totalTimeSocialEngineeringContractTx = 0;

    for (let i = 0; i < processingRuns; i++) {
      const startTimeOtherTx = performance.now();
      await handleRealTransaction(otherTxEvent);
      const endTimeOtherTx = performance.now();
      totalTimeOtherTx += endTimeOtherTx - startTimeOtherTx;

      const startTimeNativeTransferTx = performance.now();
      await handleRealTransaction(nativeTransferTxEvent);
      const endTimeNativeTransferTx = performance.now();
      totalTimeNativeTransferTx +=
        endTimeNativeTransferTx - startTimeNativeTransferTx;

      const startTimeSuspiciousNativeTransferTx = performance.now();
      await handleRealTransaction(suspiciousNativeTransferTxEvent);
      const endTimeSuspiciousNativeTransferTx = performance.now();
      totalTimeSuspiciousNativeTransferTx +=
        endTimeSuspiciousNativeTransferTx - startTimeSuspiciousNativeTransferTx;

      const startTimePhishingContractDeploymentTx = performance.now();
      await handleRealTransaction(phishingContractDeploymentTxEvent);
      const endTimePhishingContractDeploymentTx = performance.now();
      totalTimePhishingContractDeploymentTx +=
        endTimePhishingContractDeploymentTx -
        startTimePhishingContractDeploymentTx;

      const startTimeOwnerWithdrawalTx = performance.now();
      await handleRealTransaction(ownerWithdrawalTxEvent);
      const endTimeOwnerWithdrawalTx = performance.now();
      totalTimeOwnerWithdrawalTx +=
        endTimeOwnerWithdrawalTx - startTimeOwnerWithdrawalTx;

      const startTimeSocialEngineeringEoaTx = performance.now();
      await handleRealTransaction(socialEngineeringEoaTxEvent);
      const endTimeSocialEngineeringEoaTx = performance.now();
      totalTimeSocialEngineeringEoaTx +=
        endTimeSocialEngineeringEoaTx - startTimeSocialEngineeringEoaTx;

      const startTimeSocialEngineeringContractTx = performance.now();
      await handleRealTransaction(socialEngineeringContractTxEvent);
      const endTimeSocialEngineeringContractTx = performance.now();
      totalTimeSocialEngineeringContractTx +=
        endTimeSocialEngineeringContractTx -
        startTimeSocialEngineeringContractTx;
    }

    const processingTimeOtherTx = totalTimeOtherTx / processingRuns;
    const processingTimeNativeTransferTx =
      totalTimeNativeTransferTx / processingRuns;
    const processingTimeSuspiciousNativeTransferTx =
      totalTimeSuspiciousNativeTransferTx / processingRuns;
    const processingTimePhishingContractDeploymentTx =
      totalTimePhishingContractDeploymentTx / processingRuns;
    const processingTimeOwnerWithdrawalTx =
      totalTimeOwnerWithdrawalTx / processingRuns;
    const processingTimeSocialEngineeringEoaTx =
      totalTimeSocialEngineeringEoaTx / processingRuns;
    const processingTimeSocialEngineeringContractTx =
      totalTimeSocialEngineeringContractTx / processingRuns;

    console.log(
      (processingTimeOtherTx * 0.5 +
        processingTimeNativeTransferTx * 0.47 +
        processingTimeSuspiciousNativeTransferTx * 0.01 +
        processingTimePhishingContractDeploymentTx * 0.005 +
        processingTimeOwnerWithdrawalTx * 0.005 +
        processingTimeSocialEngineeringEoaTx * 0.005 +
        processingTimeSocialEngineeringContractTx * 0.005) /
        7
    );
    expect(
      (processingTimeOtherTx * 0.5 +
        processingTimeNativeTransferTx * 0.47 +
        processingTimeSuspiciousNativeTransferTx * 0.01 +
        processingTimePhishingContractDeploymentTx * 0.005 +
        processingTimeOwnerWithdrawalTx * 0.005 +
        processingTimeSocialEngineeringEoaTx * 0.005 +
        processingTimeSocialEngineeringContractTx * 0.005) /
        7
    ).toBeLessThan(320);
  });

  it("Should return empty findings if the input data is not a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setBlock(1234456)
      .setData("0x00");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return empty findings if the call is to a contract", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setBlock(121212)
      .setData("0x12345678");
    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(false);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return a Medium severity finding if the call is to an EOA, the value is non-zero and there's input data that's a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setBlock(775577)
      .setData("0x12345678")
      .setHash("0xabcd");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.getNonce)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(20000);
    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(true);

    when(mockFetcher.getSignature)
      .calledWith("0x12345678")
      .mockReturnValue("transfer(address,uint256)");

    when(mockFetcher.isValueUnique)
      .calledWith(
        createAddress("0x01"),
        1,
        "0xabcd",
        ethers.BigNumber.from("0x0bb").toString()
      )
      .mockReturnValue(true);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-1", ScanCountType.TxWithInputDataCount, 0)
      .mockReturnValue(0.0034234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0034234,
        FindingSeverity.Medium
      ),
    ]);
  });

  it("Should return an Info severity finding if the call is to an EOA, the value is zero and there's input data that's a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0")
      .setBlock(7755227)
      .setData("0x12345678")
      .setHash("0xabcd");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(true);

    when(mockFetcher.getSignature)
      .calledWith("0x12345678")
      .mockReturnValue("transfer(address,uint256)");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-2", ScanCountType.TxWithInputDataCount, 0)
      .mockReturnValue(0.0234234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0234234,
        FindingSeverity.Info
      ),
    ]);
  });

  it("Should return a Low severity finding if the call is to a contract, the value is non-zero and there's input data that's a function signature which had previous resulted in a EOA alert", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setBlock(88888)
      .setData("0xa9059cbb")
      .setHash("0xabcd");

    mockStoredData.alertedHashes.push("0xa9059cbb");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.getCode)
      .calledWith(createAddress("0x01"))
      .mockReturnValue("0xccc");
    when(mockFetcher.getFunctions)
      .calledWith("0xccc")
      .mockReturnValue(["func1, transfer(address,uint256)"]);
    when(mockFetcher.getAddressInfo)
      .calledWith(createAddress("0x01"), createAddress("0x0f"), 1, "0xabcd")
      .mockReturnValue([true, false]);
    when(mockFetcher.getNonce)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(20000);
    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(false);

    when(mockFetcher.getSignature)
      .calledWith("0xa9059cbb")
      .mockReturnValue("transfer(address,uint256)");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-3", ScanCountType.TxWithInputDataCount, 0)
      .mockReturnValue(0.0034234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateLowSeverityFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0034234
      ),
    ]);
  });

  it("should return a High severity finding when an EOA suspiciously receives native tokens from 8+ different addressess", async () => {
    const to = createAddress("0x01");
    mockStoredData.nativeTransfers[to] = [
      {
        from: createAddress("0xaa"),
        fromNonce: 32,
        fundingAddress: createAddress("0xbb"),
        latestTo: createAddress("0x01"),
        value: "323",
        timestamp: 160,
      },
      {
        from: createAddress("0xab"),
        fromNonce: 33,
        fundingAddress: createAddress("0xbbc"),
        latestTo: createAddress("0x02"),
        value: "324",
        timestamp: 161,
      },
      {
        from: createAddress("0xad"),
        fromNonce: 34,
        fundingAddress: createAddress("0xbbd"),
        latestTo: createAddress("0x03"),
        value: "325",
        timestamp: 162,
      },
      {
        from: createAddress("0xae"),
        fromNonce: 35,
        fundingAddress: createAddress("0xbbe"),
        latestTo: createAddress("0x04"),
        value: "326",
        timestamp: 161,
      },
      {
        from: createAddress("0xaf"),
        fromNonce: 36,
        fundingAddress: createAddress("0xbcc"),
        latestTo: createAddress("0x05"),
        value: "32343",
        timestamp: 163,
      },
      {
        from: createAddress("0xaaa1"),
        fromNonce: 37,
        fundingAddress: createAddress("0xbbaa"),
        latestTo: createAddress("0x06"),
        value: "32234432",
        timestamp: 164,
      },
      {
        from: createAddress("0xaadd"),
        fromNonce: 324,
        fundingAddress: createAddress("0xbbabab"),
        latestTo: createAddress("0x07"),
        value: "32312121",
        timestamp: 16032,
      },
    ];
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(to)
      .setValue("0x0bb")
      .setBlock(3232)
      .setTimestamp(6564564)
      .setHash("0xabcd");

    when(mockFetcher.getNonce)
      .calledWith(createAddress("0x0f"))
      .mockReturnValue(2);

    when(mockFetcher.getAddresses)
      .calledWith(createAddress("0x0f"), 1, "0xabcd")
      .mockReturnValue([createAddress("0x0909"), createAddress("0x0988")]);

    when(mockFetcher.getLabel)
      .calledWith(to, 1)
      .mockReturnValue("Fake_Phishing");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.isRecentlyInvolvedInTransfer)
      .calledWith(createAddress("0x0f"), "0xabcd", 1, 3232)
      .mockReturnValue(false);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-4", ScanCountType.TransferCount, 0)
      .mockReturnValue(0.00000034234);

    const transfers = mockStoredData.nativeTransfers[to];
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateHighSeverityFinding(to, 0.00000034234, transfers),
    ]);
  });

  it("should return no findings if a contract is deployed but the contract code doesn't have native ice phishing characteristics", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce("0xccc");
    when(mockFetcher.getEvents).calledWith("0xccc").mockReturnValueOnce([]);
    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce("Not Malicious Contract Code");
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings if a contract is deployed, the contract code can't be fetched, but the bytecode doesn't code the withdraw function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce("0xccc");
    when(mockFetcher.getEvents).calledWith("0xccc").mockReturnValueOnce([]);

    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce("");
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if a contract is deployed and the contract code contains both a payable function and a withdraw-like function", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce("0xccc");
    when(mockFetcher.getEvents).calledWith("0xccc").mockReturnValueOnce([]);

    const sourceCode = `function random() payable {}
    function withdraw() {
      require(owner == msg.sender);
      msg.sender.transfer(address(this).balance);
    }`;
    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce(sourceCode);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-5", ScanCountType.ContractCreationCount, 0)
      .mockReturnValue(0.0034231);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateCriticalSeverityFinding(
        "0xabcd",
        createAddress("0x0f"),
        mockContractAddress,
        0.0034231
      ),
    ]);
  });

  it("should return a finding if a contract is deployed, the source code can't be fetched, but the bytecode contains a withdraw function and a payable function which has already created an alert", async () => {
    mockStoredData.alertedHashes.push("0xa9059cbb");

    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce(`0xa9059cbb${WITHDRAW_SIG}`);
    when(mockFetcher.getEvents)
      .calledWith(`0xa9059cbb${WITHDRAW_SIG}`)
      .mockReturnValueOnce([]);
    when(mockFetcher.getFunctions)
      .calledWith(`0xa9059cbb${WITHDRAW_SIG}`)
      .mockReturnValueOnce([]);
    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce("");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-5", ScanCountType.ContractCreationCount, 0)
      .mockReturnValueOnce(0.0034231);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateCriticalSeverityFinding(
        "0xabcd",
        createAddress("0x0f"),
        mockContractAddress,
        0.0034231
      ),
    ]);
  });

  it("should return a finding if there's a withdrawal from the owner of a contract used for native ice phishing attack", async () => {
    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setData(
        "0x00f714ce00000000000000000000000000000000000000000000000000128ed4154bf6b9000000000000000000000000bca7af384bc384f86d78e37516537b3fecb86bbc"
      )
      .setBlock(234)
      .setHash("0xabcd");

    when(mockFetcher.getOwner)
      .calledWith(createAddress("0x01"), 234)
      .mockResolvedValueOnce(createAddress("0x0f"));

    when(mockFetcher.getNumberOfLogs)
      .calledWith(createAddress("0x01"), 234, 1)
      .mockResolvedValueOnce(1);

    when(mockFetcher.hasValidEntries)
      .calledWith(createAddress("0x01"), 1, "0xabcd")
      .mockResolvedValueOnce(true);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-6", ScanCountType.CustomScanCount, 16) // 15 perf test withdrawals + 1 current
      .mockReturnValueOnce(0.0134231);

    const findings: Finding[] = await handleTransaction(tx);
    const receiver = "0xbca7af384bc384f86d78e37516537b3fecb86bbc";
    expect(findings).toStrictEqual([
      testCreateWithdrawalFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        receiver,
        0.0134231
      ),
    ]);
  });

  it("should return a Critical finding when a suspicious EOA receives funds from 8+ different EOAs and has no other interactions with those EOAs for a week", async () => {
    const mockInfoAlerts: { alerts: Alert[] } = {
      alerts: [
        {
          hasAddress: () => true,
          metadata: {
            attacker: "0x0f",
            victim1: "0x01",
            victim2: "0x02",
          },
        },
      ],
    };
    handleBlock = provideHandleBlock(
      mockFetcher as any,
      mockPersistenceHelper as any,
      mockStoredData,
      mockDatabaseObjectKeys,
      mockInfoAlerts,
      mockGetAlerts,
      mockCalculateRate
    );

    mockPersistenceHelper.load.mockReturnValueOnce([]).mockReturnValueOnce([]);
    mockCalculateRate.mockReturnValueOnce(0.5134231);

    const blockEvent: TestBlockEvent = new TestBlockEvent();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      testCreateCriticalNIPSeverityFinding("0x0f", ["0x01", "0x02"], 0.5134231),
    ]);
  });
});
