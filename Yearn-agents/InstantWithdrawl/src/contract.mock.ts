export const mockPrice = jest.fn();

export const mockWithdrawBalance = jest.fn();
export const mockCallBalance = jest.fn();

export const buildMockClass = () =>
  class MockContract {
    public methods = {
      withdraw: this.withdraw,
      balanceOf: this.balanceOf,
    };

    constructor(_: any, address: string) {}

    private withdraw() {
      return {
        send: mockWithdrawBalance,
      };
    }

    private balanceOf() {
      return {
        call: mockCallBalance,
      };
    }
  };

export const buildWeb3Mock = () =>
  class Web3 {
    eth = {
      Contract: buildMockClass(),
    };
    constructor(provider: any) {}
  };
