import { createAddress } from "forta-agent-tools";

const mockPrice = jest.fn();
mockPrice
  .mockReturnValueOnce(1.1) // First call. Tracker = 101
  .mockReturnValueOnce(1) // Second test. Tracker = 100  (<101)
  .mockReturnValueOnce(100) // Third test. Tracker = 200. ( > 100 )
  .mockReturnValueOnce(10); // Fourth test.

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
