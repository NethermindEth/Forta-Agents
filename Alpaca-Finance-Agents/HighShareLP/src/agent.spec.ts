import { HandleBlock } from "forta-agent";
import { provideHandleBlock } from "./agent";
import {
  createAddress,
  TestBlockEvent,
  encodeParameter,
  encodeParameters,
} from "forta-agent-tools";
import { when, resetAllWhenMocks } from "jest-when";
import {
  isCallToTotalSupply,
  isCallToLpToken,
  isCallToPid,
  isCallToBscPool,
  isCallToWexMaster,
  isCallToMasterChef,
  isCallToUserInfo,
} from "./mock.utils";
import { constants } from "ethers";
import { createFinding } from "./utils";

const workers = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
  createAddress("0x047"),
];

const lpTokens = [
  createAddress("0x5"),
  createAddress("0x6"),
  createAddress("0x7"),
];

const masterChef = createAddress("0x8");
const bscPool = createAddress("0x9");
const wexPool = createAddress("0x10");

const addressesRegistry = {
  vaults: [
    {
      workers: [
        {
          address: workers[0],
          lpToken: lpTokens[0],
        },
        {
          address: workers[1],
          lpToken: lpTokens[1],
        },
      ],
    },
    {
      workers: [
        {
          address: workers[2],
          lpToken: lpTokens[2],
        },
        {
          address: workers[3],
          lpToken: constants.AddressZero, // Disabled worker
        },
      ],
    },
  ],
};

const mockAddressFetcher = () => addressesRegistry;

const mockCall = jest.fn();
const mockEthers = {
  call: mockCall,
  _isProvider: true, // Necessary for being an ethers provider
} as any;

const setTotalSuppliesValues = (
  token1: string,
  token2: string,
  token3: string
) => {
  when(mockCall)
    .calledWith(isCallToTotalSupply(lpTokens[0]), expect.anything())
    .mockReturnValue(encodeParameter("uint256", token1));
  when(mockCall)
    .calledWith(isCallToTotalSupply(lpTokens[1]), expect.anything())
    .mockReturnValue(encodeParameter("uint256", token2));
  when(mockCall)
    .calledWith(isCallToTotalSupply(lpTokens[2]), expect.anything())
    .mockReturnValue(encodeParameter("uint256", token3));
};

describe("Worker With Too Much Shares Test Suite", () => {
  let handleBlock: HandleBlock;

  beforeEach(() => {
    resetAllWhenMocks();

    handleBlock = provideHandleBlock(
      mockAddressFetcher as any,
      51,
      100,
      mockEthers
    );

    for (let vault of addressesRegistry.vaults) {
      for (let worker of vault.workers) {
        when(mockCall)
          .calledWith(isCallToLpToken(worker.address), expect.anything())
          .mockReturnValue(encodeParameter("address", worker.lpToken));
      }
    }

    when(mockCall)
      .calledWith(isCallToPid(workers[0]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 1));
    when(mockCall)
      .calledWith(isCallToPid(workers[1]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 2));
    when(mockCall)
      .calledWith(isCallToPid(workers[2]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 3));
    when(mockCall)
      .calledWith(isCallToPid(workers[3]), expect.anything())
      .mockReturnValue(encodeParameter("uint256", 0));

    when(mockCall)
      .calledWith(isCallToMasterChef(workers[0]), expect.anything())
      .mockReturnValue(encodeParameter("address", masterChef));
    when(mockCall)
      .calledWith(isCallToBscPool(workers[1]), expect.anything())
      .mockReturnValue(encodeParameter("address", bscPool));
    when(mockCall)
      .calledWith(isCallToWexMaster(workers[2]), expect.anything())
      .mockReturnValue(encodeParameter("address", wexPool));
  });

  it("should return empty findings if all the workers have a shares percent less than the threshold", async () => {
    setTotalSuppliesValues("1000", "25000", "500000");
    when(mockCall)
      .calledWith(
        isCallToUserInfo(masterChef, 1, workers[0]),
        expect.anything()
      )
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [200, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(bscPool, 2, workers[1]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [200, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(wexPool, 3, workers[2]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [200, 300]));

    const blockEvent = new TestBlockEvent().setNumber(10);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if one of the worker owns more than threshold number of shares", async () => {
    setTotalSuppliesValues("1000", "25000", "500000");
    when(mockCall)
      .calledWith(
        isCallToUserInfo(masterChef, 1, workers[0]),
        expect.anything()
      )
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [600, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(bscPool, 2, workers[1]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [200, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(wexPool, 3, workers[2]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [200, 300]));

    const blockEvent = new TestBlockEvent().setNumber(10);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(workers[0], "60")]);
  });

  it("should return multiple findings if multiple workers owns more than threshold number of shares", async () => {
    setTotalSuppliesValues("1000", "25000", "500000");
    when(mockCall)
      .calledWith(
        isCallToUserInfo(masterChef, 1, workers[0]),
        expect.anything()
      )
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [300, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(bscPool, 2, workers[1]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [20000, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(wexPool, 3, workers[2]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [300000, 300]));

    const blockEvent = new TestBlockEvent().setNumber(10);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(workers[1], "80"),
      createFinding(workers[2], "60"),
    ]);
  });

  it("should not scan all blocks", async () => {
    setTotalSuppliesValues("1000", "25000", "500000");
    when(mockCall)
      .calledWith(
        isCallToUserInfo(masterChef, 1, workers[0]),
        expect.anything()
      )
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [600, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(bscPool, 2, workers[1]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [300, 300]));
    when(mockCall)
      .calledWith(isCallToUserInfo(wexPool, 3, workers[2]), expect.anything())
      .mockReturnValue(encodeParameters(["uint256", "uint256"], [300, 300]));

    let blockEvent = new TestBlockEvent().setNumber(10);
    let findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(workers[0], "60")]);

    blockEvent = new TestBlockEvent().setNumber(10);
    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });
});
