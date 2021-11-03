import { createAddress } from "forta-agent-tools";

export const mockPrice = jest.fn();

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
        call: () => [createAddress("0x01")],
      };
    }
  };

export default {
  build_Mock,
};
