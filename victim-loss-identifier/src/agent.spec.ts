import { FindingType, FindingSeverity, Finding, HandleTransaction, createTransactionEvent, ethers } from "forta-agent";

describe("Victim & Loss Identifier Test Suite", () => {
  describe("Fraudulent NFT Order Test Suite", () => {
    it("creates an alert when Scam Detector emits a SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {});

    it("doesn't create an alert when Scam Detector emits a non-SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {});

    it("doesn't create an alert when there is a legitimate sale/purchase of an NFT", async () => {});

    it("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload", async () => {});

    it("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload, even if there are legimitate sales within the same payload", async () => {});

    it("does not create alerts for an address that was found out to be associated with a particular scammer address", async () => {});

    it("does not create alerts when the value paid for an NFT is higher than the upper limit set", async () => {});
  });
});
