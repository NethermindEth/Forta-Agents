import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  EventType,
  Network,
  HandleBlock,
  BlockEvent,
} from "forta-agent";
import agent, { provideHandleBlock } from ".";
import { ASSETS_ADDRESSES, Assets } from "./constants";

const createReserveUtilizationGetterMock = (reserveUtilizations: {
  [key: string]: bigint;
}): any => {
  return {
    getUtilization: jest.fn((asset: string) => {
      return reserveUtilizations[asset];
    }),
  };
};

const createFinding = (assetName: string, severity: FindingSeverity) => {
  return Finding.fromObject({
    name: "High use Aave reserve",
    description:
      "Detects assets with high use of their reserve in Aave protocol",
    alertId: "NETHFORTA-14",
    severity: severity,
    type: FindingType.Suspicious,
    metadata: {
      Asset: assetName,
    },
  });
};

const createBlockEvent = () => {
  return new BlockEvent(EventType.BLOCK, Network.MAINNET, "", 15);
};

describe("high aave reserve utilization agent", () => {
  describe("reserves at normal level", () => {
    it("should returns empty findings reserve utilization are normals", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(75),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([]);
    });
  });

  describe("reserves above normal level", () => {
    it("should returns a finding if some reserve is above medium level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(86),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      const findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([createFinding("DAI", FindingSeverity.Medium)]);
    });

    it("should returns multiple findings if multiple assets's reserve is above medium level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(88),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(86),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        createFinding("USDC", FindingSeverity.Medium),
        createFinding("DAI", FindingSeverity.Medium),
      ]);
    });

    it("shouldn't return findings if the reserve keeps the same level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(86),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      let findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([createFinding("DAI", FindingSeverity.Medium)]);

      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);
    });

    it("should return finding if the reserve go up, go down and go up again", async () => {
      const initialReserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(86),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      let mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        initialReserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      let findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([createFinding("DAI", FindingSeverity.Medium)]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(80);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(86);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([createFinding("DAI", FindingSeverity.Medium)]);

    });
  });

  describe("reserves in high level", () => {
    it("returns a finding if some reserve is above medium level", async () => {});

    it("returns a finding with multiple assets is reserve is above medium level", async () => {});
  });

  describe("reserves in critical level", () => {
    it("returns a finding if some reserve is above medium level", async () => {});

    it("returns a finding with multiple assets is reserve is above medium level", async () => {});
  });
});
