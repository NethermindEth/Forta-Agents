import {
  HandleTransaction,
} from "forta-agent"
import { provideHandleTransaction, FUNCTION_ABIS } from "./agent"
import { TestTransactionEvent, createAddress } from "forta-agent-tools";
import { ethers } from "ethers";
import { createFinding } from "./utils";


describe("State Contract Mangement Tests", () => {
  let handleTransaction: HandleTransaction;
  let stakeContractAddress: string;
  let contractInterface: ethers.utils.Interface;


  beforeAll(() => {
    stakeContractAddress = createAddress("0x1");
    contractInterface = new ethers.utils.Interface(FUNCTION_ABIS);
    handleTransaction = provideHandleTransaction(FUNCTION_ABIS, stakeContractAddress);
  });

  it("should return empty findings if no call is done", async () => {
    const txEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([])
  });

  it("should return a finding if addRecipient method was called on the stake contract", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: stakeContractAddress,
      input: contractInterface.encodeFunctionData("addRecipient", [createAddress("0x1"), 100]),
    });

    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([ createFinding("addRecipient") ]);
  });

  it("should return a finding if removeRecipient method was called on the stake contract", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: stakeContractAddress,
      input: contractInterface.encodeFunctionData("removeRecipient", [1, createAddress("0x1")]),
    });

    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([ createFinding("removeRecipient") ]);
  });

  it("should return a finding if setAdjustment method was called on the stake contract", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: stakeContractAddress,
      input: contractInterface.encodeFunctionData("setAdjustment", [100, true, 1, 5]),
    });

    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([ createFinding("setAdjustment") ]);
  });

  it("should ignore correct function calls but in different contracts", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: createAddress("0x3"),
      input: contractInterface.encodeFunctionData("addRecipient", [createAddress("0x1"), 100]),
    });

    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings if multiple relevant methods are called in the correct contract", async () => {
    const txEvent = new TestTransactionEvent().addTraces({
      to: stakeContractAddress,
      input: contractInterface.encodeFunctionData("addRecipient", [createAddress("0x1"), 100]),
    },{
      to: stakeContractAddress,
      input: contractInterface.encodeFunctionData("removeRecipient", [2, createAddress("0x1")]),
    });

    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([ createFinding("addRecipient"), createFinding("removeRecipient") ]);
  });
})
