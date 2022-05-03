import { BigNumber } from "ethers";
import HatFetcher from "./hat.fetcher";
import { mockWrapper } from "./test.utils";
import { provideHatChecker, createFinding } from "./new.hat";
import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import { createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { AddressVerifier, HatFinding, generateAddressVerifier, toBalance } from "./utils";

const alertId: string = "Test Findings";
const chief: string = createAddress("0xa");
const threshold: BigNumber = BigNumber.from(20);
const isKnown: AddressVerifier = generateAddressVerifier([
  createAddress("0xb"),
  createAddress("0xc"),
  createAddress("0xd"),
]);

describe("Chief Contract Hat Changes detector test suite", () => {
  let handleBlock: HandleBlock;
  const { setHat, setApproval, mockProvider } = mockWrapper(chief);
  let fetcher: HatFetcher;
  let mockAddressFetcher: any;

  beforeAll(() => {
    mockAddressFetcher = {
      getChiefAddress: jest.fn(),
      chiefAddress: chief,
    };
    fetcher = new HatFetcher(mockAddressFetcher, mockProvider as any);
  });
  beforeEach(() => {
    mockProvider.clear();
    handleBlock = provideHatChecker(alertId, isKnown, threshold, fetcher);
  });

  it("should report when hat is an unknown address", async () => {
    const block: number = 1;
    const hat: string = createAddress("0xDEAD");
    const previousHat: string = createAddress("0x1");
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(block);

    setHat(block - 1, previousHat);
    setHat(block, hat);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(alertId, HatFinding.UnknownHat, { hat: hat.toLowerCase() })]);
  });

  it("should report when hat is modified", async () => {
    const block: number = 2;
    const hat: string = createAddress("0xB");
    const previousHat: string = createAddress("0xDEAD");
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(block);

    setHat(block - 1, previousHat);
    setApproval(block, hat, toBalance(threshold));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(alertId, HatFinding.HatModified, {
        hat: hat.toLowerCase(),
        previousHat: previousHat.toLowerCase(),
      }),
    ]);
  });

  it("should report when hat approvals is below the threshold", async () => {
    const block: number = 2;
    const hat: string = createAddress("0xC");
    const previousHat: string = hat;
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(block);

    setHat(block - 1, previousHat);
    setApproval(block, hat, toBalance(threshold).sub(1));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(alertId, HatFinding.FewApprovals, {
        hat: hat.toLowerCase(),
        MKR: toBalance(threshold).sub(1).toString(),
        threshold: toBalance(threshold).toString(),
      }),
    ]);
  });

  it("should report when hat is unknown and the approvals is below the threshold", async () => {
    const block: number = 2;
    const hat: string = createAddress("0xD");
    const previousHat: string = createAddress("0xDEAD");
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(block);

    setHat(block - 1, previousHat);
    setApproval(block, hat, toBalance(threshold).sub(1));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(alertId, HatFinding.HatModified, {
        hat: hat.toLowerCase(),
        previousHat: previousHat.toLowerCase(),
      }),
      createFinding(alertId, HatFinding.FewApprovals, {
        hat: hat.toLowerCase(),
        MKR: toBalance(threshold).sub(1).toString(),
        threshold: toBalance(threshold).toString(),
      }),
    ]);
  });

  it("should report 0 findings if hat remains valid", async () => {
    const block: number = 2;
    const hat: string = createAddress("0xB");
    const previousHat: string = hat;
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(block);

    setHat(block - 1, previousHat);
    setApproval(block, hat, toBalance(threshold));

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });
});
