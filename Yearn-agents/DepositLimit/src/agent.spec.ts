import { HandleBlock } from "forta-agent";
import { provideHandlerBlock } from "./agent";
import {
  TestBlockEvent,
  createAddress,
  encodeParameter,
} from "forta-agent-tools";
import { when } from "jest-when";
import { helperInterface, vaultInterface } from "./abi";
import { ethers } from "ethers";
import { createFinding } from "./utils";

const isCallMethod = (
  data: string,
  contractInterface: ethers.utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

const isCallToAssetsAddresses = when(({ data }) =>
  isCallMethod(data, helperInterface, "assetsAddresses")
);
const isCallToTotalAssets = when(({ data }) =>
  isCallMethod(data, vaultInterface, "totalAssets")
);
const isCallToDepositLimit = when(({ data }) =>
  isCallMethod(data, vaultInterface, "depositLimit")
);

const callMock = jest.fn();

const ethersProviderMock = {
  call: callMock,
  _isProvider: true, // Necessary for ethers accepting the mock as a Provider
};

describe("Yearn Vault Deposit Limit Tests", () => {
  let handleBlock: HandleBlock;

  it("should return empty finding if total assets are below 90% of deposit limit", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mock values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 80));
    when(callMock)
      .calledWith(isCallToDepositLimit, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));

    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if the total assets are above 90% of deposit limit", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mock values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 95));
    when(callMock)
      .calledWith(isCallToDepositLimit, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));

    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "100", "95")]);
  });

  it("should return a finding per vault where total assets are above 90% of deposit limit", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mocks values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(
        encodeParameter("address[]", [
          createAddress("0x1"),
          createAddress("0x2"),
          createAddress("0x3"),
        ])
      );
    when(callMock)
      .calledWith(isCallToDepositLimit, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValueOnce(encodeParameter("uint256", 70))
      .mockResolvedValueOnce(encodeParameter("uint256", 90))
      .mockResolvedValueOnce(encodeParameter("uint256", 95));

    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(createAddress("0x2"), "100", "90"),
      createFinding(createAddress("0x3"), "100", "95"),
    ]);
  });

  // BLOCK_LAPSE = 265
  it("should return a findings from the same vault only once per BLOCK_LAPSE", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mocks values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 95));
    when(callMock)
      .calledWith(isCallToDepositLimit, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));

    let blockEvent = new TestBlockEvent().setNumber(10);

    let findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "100", "95")]);

    blockEvent = new TestBlockEvent().setNumber(12);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockEvent = new TestBlockEvent().setNumber(300);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "100", "95")]);
  });

  it("should return finding if the vault was close to deposit limit, had correct state after and again was close to deposit limit", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mocks values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToDepositLimit, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValueOnce(encodeParameter("uint256", 90))
      .mockResolvedValueOnce(encodeParameter("uint256", 70))
      .mockResolvedValueOnce(encodeParameter("uint256", 95));

    let blockEvent = new TestBlockEvent().setNumber(10);

    let findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "100", "90")]);

    blockEvent = new TestBlockEvent().setNumber(11);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockEvent = new TestBlockEvent().setNumber(12);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "100", '95')]);
  });

  it("should return correct findings even with async process on blocks", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mocks values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToDepositLimit, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValueOnce(encodeParameter("uint256", 90))
      .mockResolvedValueOnce(encodeParameter("uint256", 70))
      .mockResolvedValueOnce(encodeParameter("uint256", 95));

    let blockEvent = new TestBlockEvent().setNumber(10);

    let findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "100", "90")]);

    blockEvent = new TestBlockEvent().setNumber(15);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockEvent = new TestBlockEvent().setNumber(12);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });
});
