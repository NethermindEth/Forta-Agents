// import { getStatsForVault } from "./utils";
// import { createAddress, encodeParameter } from "forta-agent-tools";
// import { when, resetAllWhenMocks } from "jest-when";
// import { isCallToBalanceOf, isCallToTotalSupply } from "./mock.utils";

// const callMock = jest.fn();
// const getSigner = (address: string) => {
//   return {
//     _isSigner: true,
//     call: callMock,
//     sendTransaction: callMock,
//     getAddress: () => address,
//   };
// };
// const etherMock = {
//   call: callMock,
//   sendTransaction: callMock,
//   getSigner: getSigner,
//   _isProvider: true, // This is necessary for being an ether provider
// } as any;

// const vault = createAddress("0x1");
// const investors = [
//   createAddress("0x2"),
//   createAddress("0x3"),
//   createAddress("0x4"),
//   createAddress("0x5"),
// ];
// const investorsInfo = [
//   {
//     vault: {
//       id: vault,
//     },
//     account: {
//       id: investors[0],
//     },
//   },
//   {
//     vault: {
//       id: vault,
//     },
//     account: {
//       id: investors[1],
//     },
//   },
//   {
//     vault: {
//       id: vault,
//     },
//     account: {
//       id: investors[2],
//     },
//   },
//   {
//     vault: {
//       id: vault,
//     },
//     account: {
//       id: investors[3],
//     },
//   },
// ];

// const createFork = (...args: any[]) => etherMock;

describe("Yearn Vault Instant Withdrawns Test Suite", () => {
  // beforeEach(() => {
  //   resetAllWhenMocks();
  // });

  it("should return the correct values", async () => {
    // when(callMock)
    //   .calledWith(isCallToTotalSupply, undefined)
    //   .mockReturnValue(encodeParameter("uint256", 6000));
    // when(callMock)
    //   .calledWith(isCallToBalanceOf, undefined)
    //   // Balances before
    //   .mockReturnValueOnce(encodeParameter("uint256", 1000))
    //   .mockReturnValueOnce(encodeParameter("uint256", 700))
    //   .mockReturnValueOnce(encodeParameter("uint256", 2000))
    //   .mockReturnValueOnce(encodeParameter("uint256", 300))
    //   // Balances after
    //   .mockReturnValueOnce(encodeParameter("uint256", 0))
    //   .mockReturnValueOnce(encodeParameter("uint256", 0))
    //   .mockReturnValueOnce(encodeParameter("uint256", 0))
    //   .mockReturnValueOnce(encodeParameter("uint256", 0));

    // const [vault, totalSupply, totalInvestorsValue, ableToWithdrawn] =
    //   await getStatsForVault(investorsInfo, "", 0, createFork as any);

    // expect(vault).toStrictEqual(vault);
    // expect(totalSupply.toString()).toStrictEqual("6000");
    // expect(totalInvestorsValue.toString()).toStrictEqual("4000");
    // expect(ableToWithdrawn.toString()).toStrictEqual("4000");
  });

  // it("should return the correct values", async () => {
  //   when(callMock)
  //     .calledWith(isCallToTotalSupply, undefined)
  //     .mockReturnValue(encodeParameter("uint256", 6000));
  //   when(callMock)
  //     .calledWith(isCallToBalanceOf, undefined)
  //     // Balances before
  //     .mockReturnValueOnce(encodeParameter("uint256", 1000))
  //     .mockReturnValueOnce(encodeParameter("uint256", 1000))
  //     .mockReturnValueOnce(encodeParameter("uint256", 2000))
  //     .mockReturnValueOnce(encodeParameter("uint256", 300))
  //     // Balances after
  //     .mockReturnValueOnce(encodeParameter("uint256", 0))
  //     .mockReturnValueOnce(encodeParameter("uint256", 500))
  //     .mockReturnValueOnce(encodeParameter("uint256", 0))
  //     .mockReturnValueOnce(encodeParameter("uint256", 300));

  //   const [vault, totalSupply, totalInvestorsValue, ableToWithdrawn] =
  //     await getStatsForVault(investorsInfo, "", 0, createFork as any);

  //   expect(vault).toStrictEqual(vault);
  //   expect(totalSupply.toString()).toStrictEqual("6000");
  //   expect(totalInvestorsValue.toString()).toStrictEqual("4300");
  //   expect(ableToWithdrawn.toString()).toStrictEqual("3500");
  // });
});
