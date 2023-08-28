import { BigNumber } from "ethers";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { when } from "jest-when";

export class ExtendedMockEthersProvider extends MockEthersProvider {
  public getTransaction: any;

  constructor() {
    super();
    this.getTransaction = jest.fn();
  }

  public addTransactionResponse(txnHash: string, txnTo: string, txnValue: BigNumber) {
    when(this.getTransaction).calledWith(txnHash).mockReturnValue({ to: txnTo, value: txnValue });
  }
}
