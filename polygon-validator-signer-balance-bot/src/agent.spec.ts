import { FindingType, FindingSeverity, Finding, ethers, HandleBlock, createBlockEvent } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { POLYGON_VALIDATOR_SIGNER_ADDRESS } from "./constants";

// let MINIMUM_THRESHOLD_BIG = ethers.BigNumber.from(MINIMUM_THRESHOLD)
describe("POLYGON-VALIDATOR-SIGNER BOT TEST SUITE", () => {
  let handleBlock: HandleBlock;

  const mockEthersProvider = {
    getBalance: jest.fn(),
  } as any;

  const blockEvent = createBlockEvent({
    block: { hash: "0xa", number: 1 } as any,
  });

  beforeAll(() => {
    handleBlock = provideHandleTransaction(mockEthersProvider);
  });

  it("returns  findings if balance is above threshold", async () => {
    const balance = ethers.BigNumber.from("2000000000000000000");
    const formatThresholdToBigNumber = ethers.BigNumber.from("1000000000000000000");
    mockEthersProvider.getBalance.mockReset();
    mockEthersProvider.getBalance.mockReturnValueOnce(balance);
    const findings = await handleBlock(blockEvent);

    expect(mockEthersProvider.getBalance).toHaveBeenCalledTimes(1);
    expect(mockEthersProvider.getBalance).toHaveBeenCalledWith(
      POLYGON_VALIDATOR_SIGNER_ADDRESS,
      blockEvent.blockNumber - 1
    );
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Account balance greater than threshold!",
        description: `Account balance (${balance}) above threshold (${formatThresholdToBigNumber})`,
        alertId: "POLYGON-VALIDATOR-SIGNER-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "POLYGON-VALIDATOR-SIGNER-BOT",
        metadata: {
          balance: balance.toString(),
        },
      }),
    ]);
  });

  it("returns empty array while account balance is greater than threshold", async () => {
    const balance = ethers.BigNumber.from("500000000000000000");
    mockEthersProvider.getBalance.mockReset();
    mockEthersProvider.getBalance.mockReturnValueOnce(balance);
    const findings = await handleBlock(blockEvent);
    expect(mockEthersProvider.getBalance).toHaveBeenCalledTimes(1);
    expect(mockEthersProvider.getBalance).toHaveBeenCalledWith(
      POLYGON_VALIDATOR_SIGNER_ADDRESS,
      blockEvent.blockNumber - 1
    );
    expect(findings).toStrictEqual([]);
  });
});
