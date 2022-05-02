import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { ethers } from "ethers";
import { parseEther } from "@ethersproject/units";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { contractMetaData, createFinding } from "./utils";
import { mintTxHandler } from "./agent";
import { GLOBALS, FUNCTION_ABI } from "./constants";
const { BANANA_MINT_FUNCTION, BANANA_CONTRACT_ADDRESS_BNBCHAIN } = GLOBALS;

describe("Detect Banana Token Mints", () => {
  let handleTransaction: HandleTransaction;
  let IBanana: ethers.utils.Interface;
  let findings: Finding[];
  let txEvent: TransactionEvent;

  beforeAll(() => {
    handleTransaction = mintTxHandler(BANANA_MINT_FUNCTION, contractMetaData);
    IBanana = new ethers.utils.Interface(FUNCTION_ABI);
  });

  it("should return empty findings if there are no large banana mints", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
    expect(findings.length).toStrictEqual(0);
  });

  it(`should return findings if ${BANANA_MINT_FUNCTION} is called on the contract`, async () => {
    const parsedAmount = parseEther("25000");

    txEvent = new TestTransactionEvent().addTraces({
      to: BANANA_CONTRACT_ADDRESS_BNBCHAIN,
      input: IBanana.encodeFunctionData("mint", [parsedAmount]),
    });

    findings = await handleTransaction(txEvent);

    const [result] = findings;
    const {
      metadata: { from, to, value },
    } = result;

    expect(result).toStrictEqual(
      createFinding({
        from,
        to,
        value,
      })
    );
  });

  it(`should return findings only if banana mint amount exceeds 20000`, async () => {
    const parsedAmount = parseEther("20000");

    txEvent = new TestTransactionEvent().addTraces({
      to: BANANA_CONTRACT_ADDRESS_BNBCHAIN,
      input: IBanana.encodeFunctionData("mint", [parsedAmount]),
    });

    findings = await handleTransaction(txEvent);

    if (findings.length) {
      const [result] = findings;
      const {
        metadata: { from, to, value },
      } = result;
      expect(result).toStrictEqual(
        createFinding({
          from,
          to,
          value,
        })
      );
    } else {
      expect(findings).toStrictEqual([]);
      expect(findings.length).toStrictEqual(0);
    }
  });
});
