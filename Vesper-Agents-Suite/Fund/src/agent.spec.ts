import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent from "./agent";
import { defaultList } from "./utils";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  let mockContract = {
    methods: {
      totalValue: () => {
        return { call: jest.fn() };
      },
      tokensHere: () => {
        return { call: jest.fn() };
      },
      MAX_BPS: () => {
        return { call: jest.fn() };
      },
      totalDebtRation: () => {
        return { call: jest.fn() };
      },
    },
  };

  let mockWeb3 = {
    eth: {
      Contract: jest.fn(),
    },
  };

  beforeAll(() => {
    handleTransaction = agent.provideHandleFunction(
      mockWeb3 as any,
      defaultList
    );
  });

  it("A new transaction gets received", async () => {
    const txEvent = {
      addresses: { "0xBA680a906d8f624a5F11fba54D3C672f09F26e47": true },
    };

    mockWeb3.eth.Contract.mockReturnValue(mockContract);

    mockContract.methods.tokensHere().call.mockReturnValue(1000);
    mockContract.methods.MAX_BPS().call.mockReturnValue(10);
    mockContract.methods.totalDebtRation().call.mockReturnValue(0.8);
    mockContract.methods.totalValue().call.mockReturnValue(2000);

    const findings = await handleTransaction(txEvent as any);
    console.log(findings);
  });
});
