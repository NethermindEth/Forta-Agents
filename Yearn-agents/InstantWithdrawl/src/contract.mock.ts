export const mockPrice = jest.fn();

const mockResult = jest.fn();
mockResult
  .mockImplementationOnce(() => Promise.resolve("success"))
  .mockImplementationOnce(() => Promise.reject("failed"))
  .mockImplementationOnce(() => Promise.resolve())
  .mockImplementationOnce(() => Promise.reject());

export const buildMockClass = () =>
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

export const buildWeb3Mock = () =>
  class Web3 {
    eth = {
      Contract: buildMockClass(),
    };
    constructor(provider: any) {}
  };
