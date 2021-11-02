import BigNumber from "bignumber.js";

const mockPrice = jest.fn();
mockPrice
  .mockReturnValueOnce(1.1) // First call. Tracker = 101
  .mockReturnValueOnce(1) // Second test. Tracker = 100  (<101)
  .mockReturnValueOnce(100) // Third test. Tracker = 200. ( > 100 )
  .mockReturnValueOnce(300); // Fourth test.

const build_Mock = () =>
  class MockContract {
    private addr: string;

    public methods = {
      getPricePerFullShare: this.getPricePerFullShare,
    };

    constructor(_: any, address: string) {
      this.addr = address;
    }

    private getPricePerFullShare() {
      return {
        call: mockPrice,
      };
    }
  };

export default {
  build_Mock,
};
