import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent"
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Interface } from "@ethersproject/abi";
import abi from "./abi";

const pause = (
  time: BigNumber,
): Finding =>
  Finding.fromObject({
    name: "CAKE Operations",
    description: "Pause event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "CAKE-9-1",
    metadata: {
      time: `${time}`,
    }
  });


describe("CAKE-Operations agent tests suite", () => {
  const iface = new Interface(abi.CAKE);

  it("should ignore empty txns", async () => {
    const cake: string = createAddress("0xdead");
    const handler: HandleTransaction = provideHandleTransaction(cake);
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect Pause events", async () => {
    const cake: string = createAddress("0xdead");
    const handler: HandleTransaction = provideHandleTransaction(cake);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        iface.getEvent('Pause').format('sighash'),
        cake,
        iface.encodeEventLog(
          iface.getEvent('Pause'),
          [
            10,
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('Pause').format('sighash'),
        createAddress('0xcafe'), // should be ignored
        iface.encodeEventLog(
          iface.getEvent('Pause'),
          [
            11,
          ],
        ).data,
      )
      .addEventLog(
        iface.getEvent('Pause').format('sighash'),
        cake,
        iface.encodeEventLog(
          iface.getEvent('Pause'),
          [
            12,
          ],
        ).data,
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      pause(
        BigNumber.from(10),
      ),
      pause(
        BigNumber.from(12),
      ),
    ]);
  });
});