export const mockResponse = (
  id: string,
  balanceShares: string,
  vault: string
) => {
  return {
    account: {
      id,
    },
    balancePosition: "188378534924828697641430374",
    balanceShares,
    id: "0x6fe02be0ec79dcf582cbdb936d7037d2eb17f661-0xda816459f1ab5631232fe5e97a05bbbb94970c95",
    vault: {
      id: vault,
    },
  };
};

export const generateMockResponseArray = (values: Array<any>) => {
  return {
    data: {
      data: {
        accountVaultPositions: values.map((value) =>
          mockResponse(value.id, value.balanceShares, value.vault)
        ),
      },
    },
  };
};

const mockAxios = jest.fn();
mockAxios
  .mockResolvedValue(
    generateMockResponseArray([
      {
        vault: "0x59518884eebfb03e90a18adbaaab770d4666471e",
        id: "0xfdcd5daf992a68f297647074221cf51a3c23e4ed",
        balanceShares: "289584189215485306814849565",
      },
    ])
  )
  .mockResolvedValue(
    generateMockResponseArray([
      {
        vault: "0x59518884eebfb03e90a18adbaaab770d4666471e",
        id: "0xfdcd5daf992a68f297647074221cf51a3c23e4ed",
        balanceShares: "289584189215485306814849565",
      },
    ])
  );

export default mockAxios;
