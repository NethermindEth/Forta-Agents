import { createAddress } from "forta-agent-tools";

export const mockPrice = jest.fn();

export const mockRespone = {
  data: {
    accountVaultPositions: [
      {
        account: {
          id: "0xb698f815918e0a11cf802184f36f02cd4602ebd4",
        },
        balancePosition: "51833418246178329667517388",
        id: "0xb698f815918e0a11cf802184f36f02cd4602ebd4-0xda816459f1ab5631232fe5e97a05bbbb94970c95",
        vault: {
          id: "0xda816459f1ab5631232fe5e97a05bbbb94970c95",
        },
      },
      {
        account: {
          id: "0x80af28cb1e44c44662f144475d7667c9c0aab3c3",
        },
        balancePosition: "45969723961857515156357801",
        id: "0x80af28cb1e44c44662f144475d7667c9c0aab3c3-0x27b7b1ad7288079a66d12350c828d3c00a6f07d7",
        vault: {
          id: "0x27b7b1ad7288079a66d12350c828d3c00a6f07d7",
        },
      },
    ],
  },
};

const build_Mock = () =>
  class MockContract {
    public methods = {
      getPricePerFullShare: this.getPricePerFullShare,
      assetsAddresses: this.assetsAddresses,
    };

    constructor(_: any, address: string) {}

    private getPricePerFullShare() {
      return {
        call: mockPrice,
      };
    }

    private assetsAddresses() {
      return {
        call: () => [
          "0xda816459f1ab5631232fe5e97a05bbbb94970c95",
          "0x27b7b1ad7288079a66d12350c828d3c00a6f07d7",
        ],
      };
    }
  };

export default {
  build_Mock,
};
