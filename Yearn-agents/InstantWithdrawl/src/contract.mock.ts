export const mockPrice = jest.fn();

const mockResult = jest.fn();
mockResult
  .mockImplementationOnce(() => Promise.resolve("success"))
  .mockImplementationOnce(() => Promise.reject("failed"))
  .mockImplementationOnce(() => Promise.resolve())
  .mockImplementationOnce(() => Promise.reject());

export const build_Mock = () =>
  class MockContract {
    public methods = {
      withdraw: this.withdraw,
    };

    constructor(_: any, address: string) {}

    private withdraw() {
      return {
        send: mockResult,
      };
    }
  };

export const buildWeb3 = () =>
  class Web3 {
    eth = {
      Contract: build_Mock(),
    };
    constructor(provider: any) {}
  };
