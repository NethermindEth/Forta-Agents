export const mockResponse = {
  data: {
    data: {
      accountVaultPositions: [
        {
          account: {
            id: "0x6fe02be0ec79dcf582cbdb936d7037d2eb17f661",
          },
          balancePosition: "188378534924828697641430374",
          balanceShares: "185430576426855580035911211",
          id: "0x6fe02be0ec79dcf582cbdb936d7037d2eb17f661-0xda816459f1ab5631232fe5e97a05bbbb94970c95",
          vault: {
            id: "0xda816459f1ab5631232fe5e97a05bbbb94970c95",
          },
        },
        {
          account: {
            id: "0xb698f815918e0a11cf802184f36f02cd4602ebd4",
          },
          balancePosition: "51833418246178329667517388",
          balanceShares: "51040690824615588219939274",
          id: "0xb698f815918e0a11cf802184f36f02cd4602ebd4-0xda816459f1ab5631232fe5e97a05bbbb94970c95",
          vault: {
            id: "0xda816459f1ab5631232fe5e97a05bbbb94970c95",
          },
        },
      ],
    },
  },
};

const mockAxios = jest.fn();
mockAxios.mockResolvedValue(mockResponse);

export default mockAxios;
