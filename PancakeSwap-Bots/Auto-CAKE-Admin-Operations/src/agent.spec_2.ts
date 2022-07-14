///trying another approach ignore this 

import { FindingType, FindingSeverity, Finding, HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { encodeParameter } from "forta-agent-tools";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";

const cake: string = createAddress("0x0");

const createFinding = (time: BigNumber) =>
    Finding.fromObject({
        name: "CAKE Operations",
        description: "Pause event emitted",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        alertId: "CAKE-9-1",
        metadata: {
            time: `${time}`
        }
    });

describe("CAKE-Operations agent tests suite", () => {
    let handleTransaction: HandleTransaction;

    beforeAll(() => {
        handleTransaction = provideHandleTransaction(cake);
    });

    it("should return no finding due to empty transaction", async () => {
        const tx = new TestTransactionEvent();

        const findings = await handleTransaction(tx);

        expect(findings).toStrictEqual([]);
    });


    it("should return finding due to pause event emission", async () => {
        const tx = new TestTransactionEvent().addEventLog(
            "event Pause(uint256 indexed epoch)",
            cake,
            "0x",
            encodeParameter(BigNumber, 10)
        )

        const findings = await handleTransaction(tx);
        console.log("hi");
        console.log(findings)

        expect(findings).toStrictEqual([createFinding(BigNumber.from(10))]);
    });


});