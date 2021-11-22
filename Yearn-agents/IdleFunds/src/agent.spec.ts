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
const isCallToTotalDebt = when(({ data }) =>
  isCallMethod(data, vaultInterface, "totalDebt")
);

const callMock = jest.fn();

const ethersProviderMock = {
  call: callMock,
  _isProvider: true, // Necessary for ethers accepting the mock as a Provider
};

describe("Yearn Vault Idle Funds Tests", () => {
  let handleBlock: HandleBlock;

  it("should return empty finding if idle funds are below 25%", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mock values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalDebt, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 80));

    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if the idle funds are above 25%", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mock values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalDebt, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 70));

    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "30")]);
  });

  it("should return a finding per vault where idle funds are above 25%", async () => {
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
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalDebt, expect.anything())
      .mockResolvedValueOnce(encodeParameter("uint256", 70))
      .mockResolvedValueOnce(encodeParameter("uint256", 60))
      .mockResolvedValueOnce(encodeParameter("uint256", 90));

    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(createAddress("0x1"), "30"),
      createFinding(createAddress("0x2"), "40"),
    ]);
  });

  // BLOCK_LAPSE = 265
  it("should return a findings from the same only once per BLOCK_LAPSE", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mocks values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalDebt, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 70));

    let blockEvent = new TestBlockEvent().setNumber(10);

    let findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "30")]);

    blockEvent = new TestBlockEvent().setNumber(12);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockEvent = new TestBlockEvent().setNumber(300);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "30")]);
  });

  it("should return finding if the vault had idle funds, had correct state after and had idle funds again", async () => {
    handleBlock = provideHandlerBlock(ethersProviderMock as any);

    // set mocks values
    when(callMock)
      .calledWith(isCallToAssetsAddresses, expect.anything())
      .mockResolvedValue(encodeParameter("address[]", [createAddress("0x1")]));
    when(callMock)
      .calledWith(isCallToTotalAssets, expect.anything())
      .mockResolvedValue(encodeParameter("uint256", 100));
    when(callMock)
      .calledWith(isCallToTotalDebt, expect.anything())
      .mockResolvedValueOnce(encodeParameter("uint256", 70))
      .mockResolvedValueOnce(encodeParameter("uint256", 90))
      .mockResolvedValueOnce(encodeParameter("uint256", 75));

    let blockEvent = new TestBlockEvent().setNumber(10);

    let findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "30")]);

    blockEvent = new TestBlockEvent().setNumber(11);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockEvent = new TestBlockEvent().setNumber(12);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(createAddress("0x1"), "25")]);
  });
});
