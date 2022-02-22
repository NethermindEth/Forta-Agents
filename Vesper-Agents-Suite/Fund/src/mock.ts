const lengthMock = jest.fn();
lengthMock
  .mockReturnValueOnce("0")
  .mockReturnValueOnce("1")
  .mockReturnValueOnce("2");

const build_Mock = (
  totalValue: number,
  tokensHere: number,
  totalDebtRatio: number,
  MAX_BPS: number
) =>
  class MockContract {
    private addr: string;

    public methods = {
      totalValue: this.totalValue,
      tokensHere: this.tokensHere,
      totalDebtRatio: this.totalDebtRatio,
      MAX_BPS: this.MAXBPS
    };

    constructor(_: any, address: string) {
      this.addr = address;
    }

    private totalValue() {
      return {
        call: () => totalValue,
      };
    }
    private tokensHere() {
      return {
        call: () => tokensHere,
      };
    }

    private MAXBPS() {
      return {
        call: () => MAX_BPS,
      };
    }

    private totalDebtRatio() {
      return {
        call: () => totalDebtRatio,
      };
    }

  };

export default {
  build_Mock,
};
