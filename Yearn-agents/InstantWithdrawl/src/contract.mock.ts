import { createAddress } from "forta-agent-tools";

export const mockPrice = jest.fn();

const mockResult = jest.fn();
mockResult.mockReturnValue({}); // todo

export const build_Mock = () =>
  class MockContract {
    public methods = {
      getPricePerFullShare: this.getPricePerFullShare,
    };

    constructor(_: any, address: string) {}

    private getPricePerFullShare() {
      return {
        call: mockPrice,
      };
    }

    private withdraw() {
      return {
        send: mockResult,
      };
    }
  };
