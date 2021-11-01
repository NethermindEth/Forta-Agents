import BigNumber from "bignumber.js";

const mockPrice = jest.fn();
mockPrice
  .mockReturnValueOnce(101) // First call. Tracker = 101
  .mockReturnValueOnce(100) // Second test. Tracker = 100  (<101)
  .mockReturnValueOnce(200) // Third test. Tracker = 200. ( > 100 )
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
        call: () => mockPrice,
      };
    }
  };

export default {
  build_Mock,
};
