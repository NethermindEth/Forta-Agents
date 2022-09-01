import { HandleTransaction, TransactionEvent, keccak256 } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import {
  getFindingInstance,
  HUBPOOL_MONITORED_EVENTS,
  SPOKEPOOL_MONITORED_EVENTS,
  ARB_SPOKEPOOL_MONITORED_EVENTS,
  POLYGON_SPOKEPOOL_MONITORED_EVENTS,
  OP_SPOKEPOOL_MONITORED_EVENTS
} from "./utils";
import { provideHandleTransaction } from "./agent";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";

// @dev a helper function to verify results with the `getEventMetadata` function defined in ./utils.ts
const getEventMetadata = (args: { [key: string]: string }) => {
  const metadata: { [key: string]: string } = {};
  const keys: string[] = Object.keys(args);
  keys.forEach((key) => {
    metadata[key] = args[key].toString();
  });
  return metadata;
};
const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x54")];
const TRANSFER_EVENT_ABI = "event Transfer(address,uint)";
const TEST_HUBPOOL_ADDR: string = createAddress("0x23");
const TEST_SPOKEPOOL_ADDR: string = createAddress("0x46");
const EMPTY_ADDRESS = createAddress("0x00");
const MOCK_NM_DATA: Record<number, NetworkDataInterface> = {
  0: {
    spokePoolAddr: TEST_SPOKEPOOL_ADDR,
    hubPoolAddr: TEST_HUBPOOL_ADDR,
    monitoredSpokePoolEvents: SPOKEPOOL_MONITORED_EVENTS,
    monitoredHubPoolEvents: HUBPOOL_MONITORED_EVENTS
  },
};
const MOCK_MAINNET_SPOKEPOOL_NM_DATA: Record<number, NetworkDataInterface> = {
  0: { spokePoolAddr: TEST_SPOKEPOOL_ADDR, monitoredSpokePoolEvents: SPOKEPOOL_MONITORED_EVENTS },
};
const MOCK_ARBITRUM_NM_DATA: Record<number, NetworkDataInterface> = {
  0: { spokePoolAddr: TEST_SPOKEPOOL_ADDR, monitoredSpokePoolEvents: ARB_SPOKEPOOL_MONITORED_EVENTS },
};
const MOCK_OPTIMISM_NM_DATA: Record<number, NetworkDataInterface> = {
  0: { spokePoolAddr: TEST_SPOKEPOOL_ADDR, monitoredSpokePoolEvents: OP_SPOKEPOOL_MONITORED_EVENTS },
};
const MOCK_POLYGON_NM_DATA: Record<number, NetworkDataInterface> = {
  0: { spokePoolAddr: TEST_SPOKEPOOL_ADDR, monitoredSpokePoolEvents: POLYGON_SPOKEPOOL_MONITORED_EVENTS },
};

describe("Detection of single HubPool configuration change events on L1", () => {
  const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);

  const handleTransaction: HandleTransaction = provideHandleTransaction(networkManagerTest);

  it("returns empty findings if there is no relevant event", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a relevant event is emitted from a non-HubPool address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], RANDOM_ADDRESSES[0], ["123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if an irrelevant event is made from the HubPool address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(TRANSFER_EVENT_ABI, TEST_HUBPOOL_ADDR, [RANDOM_ADDRESSES[0], "123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event LivenessSet", async () => {
    const passedParamsDict = {
      newLiveness: "123",
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[0].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event ProtocolFeeCaptureSet", async () => {
    const passedParamsDict = {
      newProtocolFeeCaptureAddress: "0x0000000000000000000000000000000000000012",
      newProtocolFeeCapturePct: "123",
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[1], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[1].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event Paused", async () => {
    const passedParamsDict = {
      isPaused: "true",
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[2], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[2].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event BondSet", async () => {
    const passedParamsDict = {
      newBondToken: RANDOM_ADDRESSES[0],
      newBondAmount: "123",
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[3], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[3].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };

    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event IdentifierSet", async () => {
    const passedParamsDict = {
      newIdentifier: keccak256("hello world"),
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[4], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[4].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event CrossChainContractsSet", async () => {
    const passedParamsDict = {
      l2ChainId: "123",
      adapter: RANDOM_ADDRESSES[0],
      spokePool: RANDOM_ADDRESSES[1],
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[5], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[5].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event L1TokenEnabledForLiquidityProvision", async () => {
    const passedParamsDict = {
      l1Token: RANDOM_ADDRESSES[0],
      lpToken: RANDOM_ADDRESSES[1],
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[6], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[6].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event L2TokenDisabledForLiquidityProvision", async () => {
    const passedParamsDict = {
      l1Token: RANDOM_ADDRESSES[0],
      lpToken: RANDOM_ADDRESSES[1],
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[6], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[6].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event SetPoolRebalanceRoute", async () => {
    const passedParamsDict = {
      destinationChainId: "123",
      l1Token: RANDOM_ADDRESSES[0],
      destinationToken: RANDOM_ADDRESSES[1],
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[8], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[8].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event SetEnableDepositRoute", async () => {
    const passedParamsDict = {
      originChainId: "123",
      destinationChainId: "456",
      originToken: RANDOM_ADDRESSES[1],
      depositsEnabled: "true",
    };
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[9], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict));

    const findings = await handleTransaction(txEvent);
    const thisFindingMetadata = {
      event: HUBPOOL_MONITORED_EVENTS[9].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict),
    };
    expect(findings).toStrictEqual([getFindingInstance(true, thisFindingMetadata)]);
  });

  describe("Detection of multiple HubPool configuration change events on L1", () => {
    const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);

    const handleTransaction: HandleTransaction = provideHandleTransaction(networkManagerTest);

    it("returns N findings for N HubPool related events (N>=1)", async () => {
      const passedParamsDict_1 = {
        l1Token: RANDOM_ADDRESSES[0],
        lpToken: RANDOM_ADDRESSES[1],
      };
      const passedParamsDict_2 = {
        newLiveness: "123",
      };

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(HUBPOOL_MONITORED_EVENTS[7], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict_1))
        .addEventLog(HUBPOOL_MONITORED_EVENTS[0], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict_2));

      const thisFindingMetadata_1 = {
        event: HUBPOOL_MONITORED_EVENTS[7].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict_1),
      };
      const thisFindingMetadata_2 = {
        event: HUBPOOL_MONITORED_EVENTS[0].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict_2),
      };

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        getFindingInstance(true, thisFindingMetadata_1),
        getFindingInstance(true, thisFindingMetadata_2),
      ]);
    });
  });

  it("returns N findings for N SpokePool related events (N>=1)", async () => {
    const passedParamsDict_1 = {
      newAdmin: RANDOM_ADDRESSES[0],
    };
    const passedParamsDict_2 = {
      newBuffer: "123",
    };

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict_1))
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[3], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict_2))
      .addEventLog(TRANSFER_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "123"]);

    const thisFindingMetadata_1 = {
      event: SPOKEPOOL_MONITORED_EVENTS[0].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict_1),
    };
    const thisFindingMetadata_2 = {
      event: SPOKEPOOL_MONITORED_EVENTS[3].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict_2),
    };

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(false, thisFindingMetadata_1),
      getFindingInstance(false, thisFindingMetadata_2),
    ]);
  });

  it("returns findings when both HubPool and SpokePool configurations change in one transaction", async () => {
    const passedParamsDict_1 = {
      newAdmin: RANDOM_ADDRESSES[0],
    };
    const passedParamsDict_2 = {
      l1Token: RANDOM_ADDRESSES[0],
      lpToken: RANDOM_ADDRESSES[1],
    };
    const passedParamsDict_3 = {
      newLiveness: "123",
    };

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict_1))
      .addEventLog(HUBPOOL_MONITORED_EVENTS[7], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict_2))
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], TEST_HUBPOOL_ADDR, Object.values(passedParamsDict_3));

    const thisFindingMetadata_1 = {
      event: SPOKEPOOL_MONITORED_EVENTS[0].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict_1),
    };
    const thisFindingMetadata_2 = {
      event: HUBPOOL_MONITORED_EVENTS[7].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict_2),
    };
    const thisFindingMetadata_3 = {
      event: HUBPOOL_MONITORED_EVENTS[0].split("(")[0].split(" ")[1],
      args: getEventMetadata(passedParamsDict_3),
    };

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(true, thisFindingMetadata_2),
      getFindingInstance(true, thisFindingMetadata_3),
      getFindingInstance(false, thisFindingMetadata_1),
    ]);
  });

  describe("(Non)Detection of HubPool events on L2", () => {
    const networkManagerTest = new NetworkManager(MOCK_MAINNET_SPOKEPOOL_NM_DATA, 0);

    const handleTransaction: HandleTransaction = provideHandleTransaction(networkManagerTest);

    it("doesn't return any findings for HubPool relevant events on L2's", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(EMPTY_ADDRESS)
        .addEventLog(HUBPOOL_MONITORED_EVENTS[0], EMPTY_ADDRESS, ["123"]);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns findings only related to SpokePools on L2's", async () => {
      const passedParamsDict = {
        newAdmin: RANDOM_ADDRESSES[0],
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(EMPTY_ADDRESS)
        .addEventLog(HUBPOOL_MONITORED_EVENTS[0], EMPTY_ADDRESS, ["123"]) // no finding shall be generated for this event
        .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: SPOKEPOOL_MONITORED_EVENTS[0].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });
  });

  describe("Base SpokePool configuration changes detection bot", () => {
    const networkManagerTest = new NetworkManager(MOCK_MAINNET_SPOKEPOOL_NM_DATA, 0);

    const handleTransaction: HandleTransaction = provideHandleTransaction(networkManagerTest);

    it("returns empty findings if there is no relevant event", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();
      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("doesn't return a finding if a relevant event is emitted from a non-SpokePool address", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], RANDOM_ADDRESSES[0], [RANDOM_ADDRESSES[1]]);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("doesn't return a finding if an irrelevant event is made from the SpokePool address", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(TRANSFER_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "123"]);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns a finding for emitted monitored event from SpokePool : Event SetXDomainAdmin", async () => {
      const passedParamsDict = {
        newAdmin: RANDOM_ADDRESSES[0],
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: SPOKEPOOL_MONITORED_EVENTS[0].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });

    it("returns a finding for emitted monitored event from SpokePool : Event SetHubPool", async () => {
      const passedParamsDict = {
        newHubPool: RANDOM_ADDRESSES[0],
      };

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(SPOKEPOOL_MONITORED_EVENTS[1], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: SPOKEPOOL_MONITORED_EVENTS[1].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });

    it("returns a finding for emitted monitored event from SpokePool : Event EnabledDepositRoute", async () => {
      const passedParamsDict = {
        originToken: RANDOM_ADDRESSES[0],
        destinationChainId: "123",
        enabled: "true",
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(SPOKEPOOL_MONITORED_EVENTS[2], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: SPOKEPOOL_MONITORED_EVENTS[2].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });

    it("returns a finding for emitted monitored event from SpokePool : Event EnabledDepositRoute", async () => {
      const passedParamsDict = {
        newBuffer: "123",
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(SPOKEPOOL_MONITORED_EVENTS[3], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: SPOKEPOOL_MONITORED_EVENTS[3].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });
  });

  describe("Arbitrum SpokePool configuration changes detection bot", () => {
    let networkManagerTest = new NetworkManager(MOCK_ARBITRUM_NM_DATA, 0);
    let handleTransaction: HandleTransaction = provideHandleTransaction(networkManagerTest);

    it("returns a finding for emitted monitored event from Arbitrum SpokePool : Event SetL2GatewayRouter", async () => {
      const passedParamsDict = {
        newL2GatewayRouter: RANDOM_ADDRESSES[0],
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(ARB_SPOKEPOOL_MONITORED_EVENTS[4], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: ARB_SPOKEPOOL_MONITORED_EVENTS[4].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });

    it("returns a finding for emitted monitored event from Arbitrum SpokePool : Event WhitelistedTokens", async () => {
      const passedParamsDict = {
        l2Token: RANDOM_ADDRESSES[0],
        l1Token: RANDOM_ADDRESSES[1],
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(ARB_SPOKEPOOL_MONITORED_EVENTS[5], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: ARB_SPOKEPOOL_MONITORED_EVENTS[5].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });
  });

  describe("Optimism SpokePool configuration changes detection bot", () => {
    let networkManagerTest = new NetworkManager(MOCK_OPTIMISM_NM_DATA, 0);
    let handleTransaction = provideHandleTransaction(networkManagerTest);

    it("returns a finding for emitted monitored event from Arbitrum SpokePool : Event SetL1Gas", async () => {
      const passedParamsDict = {
        newL1Gas: "9",
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(OP_SPOKEPOOL_MONITORED_EVENTS[4], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: OP_SPOKEPOOL_MONITORED_EVENTS[4].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });

    it("returns a finding for emitted monitored event from Arbitrum SpokePool : Event WhitelistedTokens", async () => {
      const passedParamsDict = {
        l2Token: RANDOM_ADDRESSES[0],
        tokenBridge: RANDOM_ADDRESSES[1],
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(OP_SPOKEPOOL_MONITORED_EVENTS[5], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: OP_SPOKEPOOL_MONITORED_EVENTS[5].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });
  });

  describe("Polygon SpokePool configuration changes detection bot", () => {
    let networkManagerTest = new NetworkManager(MOCK_POLYGON_NM_DATA, 0);
    let handleTransaction = provideHandleTransaction(networkManagerTest);

    it("returns a finding for emitted monitored event from Polygon SpokePool : Event SetFxChild", async () => {
      const passedParamsDict = {
        newFxChild: RANDOM_ADDRESSES[0],
      };
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(POLYGON_SPOKEPOOL_MONITORED_EVENTS[4], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: POLYGON_SPOKEPOOL_MONITORED_EVENTS[4].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });

    it("returns a finding for emitted monitored event from Polygon SpokePool : Event SetPolygonTokenBridger", async () => {
      const passedParamsDict = {
        polygonTokenBridger: RANDOM_ADDRESSES[0],
      };

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(RANDOM_ADDRESSES[1])
        .addEventLog(POLYGON_SPOKEPOOL_MONITORED_EVENTS[5], TEST_SPOKEPOOL_ADDR, Object.values(passedParamsDict));

      const findings = await handleTransaction(txEvent);
      const thisFindingMetadata = {
        event: POLYGON_SPOKEPOOL_MONITORED_EVENTS[5].split("(")[0].split(" ")[1],
        args: getEventMetadata(passedParamsDict),
      };
      expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
    });
  });
});
