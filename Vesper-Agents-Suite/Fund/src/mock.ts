import { createAddress } from "forta-agent-tools";

const lengthMock = jest.fn();
lengthMock
  .mockReturnValueOnce("0")
  .mockReturnValueOnce("1")
  .mockReturnValueOnce("2");

const build_Mock = (
  totalValue: number,
  tokensHere: number,
  totalDebtRatio: number,
  MAX_BPS: number,
  p: string[]
) =>
  class MockContract {
    private addr: string;

    public methods = {
      totalValue: this.totalValue,
      tokensHere: this.tokensHere,
      totalDebtRatio: this.totalDebtRatio,
      MAX_BPS: this.MAXBPS,
      at: this.at,
      pools: this.pools,
      length: this.length,
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

    private pools() {
      return {
        call: () => createAddress("0x0"),
      };
    }

    private length() {
      return {
        call: () => lengthMock(),
      };
    }
    private at(index: number) {
      return {
        call: () => p[index],
      };
    }
  };

export default {
  build_Mock,
};
