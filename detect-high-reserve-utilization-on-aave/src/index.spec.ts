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
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Medium),
      ]);
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
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Medium),
      ]);

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
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Medium),
      ]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(80);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(86);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Medium),
      ]);
    });
  });

  describe("reserves in high level", () => {
    it("should returns a finding if some reserve is above high level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(90),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      const findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.High),
      ]);
    });

    it("should returns multiple findings if multiple assets's reserve is above high level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(92),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(90),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        createFinding("USDC", FindingSeverity.High),
        createFinding("DAI", FindingSeverity.High),
      ]);
    });

    it("shouldn't return findings if the reserve keeps the same level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(92),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      let findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.High),
      ]);

      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);
    });

    it("should return finding if the reserve go up, go down and go up again", async () => {
      const initialReserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(91),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      let mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        initialReserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      let findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.High),
      ]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(80);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(93);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.High),
      ]);
    });
  });

  describe("reserves in critical level", () => {
    it("should returns a finding if some reserve is above very high level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(98),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      const findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Critical),
      ]);
    });

    it("should returns multiple findings if multiple assets's reserve is above very high level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(97),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(95),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        createFinding("USDC", FindingSeverity.Critical),
        createFinding("DAI", FindingSeverity.Critical),
      ]);
    });

    it("shouldn't return findings if the reserve keeps the same level", async () => {
      const reserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(99),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      const mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        reserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      let findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Critical),
      ]);

      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);
    });

    it("should return finding if the reserve go up, go down and go up again", async () => {
      const initialReserveUtilizations: { [key: string]: bigint } = {
        [ASSETS_ADDRESSES[Assets.USDC]]: BigInt(80),
        [ASSETS_ADDRESSES[Assets.DAI]]: BigInt(97),
        [ASSETS_ADDRESSES[Assets.USDT]]: BigInt(78),
      };
      let mockReserveUtilizationGetter = createReserveUtilizationGetterMock(
        initialReserveUtilizations
      );
      const handleBlock = provideHandleBlock(mockReserveUtilizationGetter);
      const blockEvent = createBlockEvent();

      let findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Critical),
      ]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(80);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);

      initialReserveUtilizations[ASSETS_ADDRESSES[Assets.DAI]] = BigInt(96);
      findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([
        createFinding("DAI", FindingSeverity.Critical),
      ]);
    });
  });
});
