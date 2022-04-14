import { MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumberish } from "ethers";
import { when } from "jest-when";
import abi from "./abi";

class MockEthersProviderExtension extends MockEthersProvider {
  public getTransactionCount = jest.fn();

  constructor() {
    super();
    this.getTransactionCount = jest.fn();
  }

  public setNonce(addr: string, block: number, nonce: number): MockEthersProviderExtension {
    when(this.getTransactionCount).calledWith(addr, block).mockReturnValue(nonce);
    return this;
  }
}

export const mockWrapper = (chief: string) => {
  const mockProvider: MockEthersProviderExtension = new MockEthersProviderExtension();

  const setHat = (block: number, hat: string) =>
    mockProvider.addCallTo(chief, block, abi.CHIEF_IFACE, "hat", { inputs: [], outputs: [hat] });

  const setApproval = (block: number, hat: string, amount: BigNumberish) => {
    setHat(block, hat);
    mockProvider.addCallTo(chief, block, abi.CHIEF_IFACE, "approvals", { inputs: [hat], outputs: [amount] });
  };

  return { setHat, setApproval, mockProvider };
};
