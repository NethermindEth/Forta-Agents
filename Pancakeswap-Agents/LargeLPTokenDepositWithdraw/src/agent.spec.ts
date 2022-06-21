import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { 
  MockEthersProvider, 
  createAddress,
} from "forta-agent-tools/lib/tests";

import { BigNumber, utils, ethers } from "ethers";
import { provideHandleTransaction } from "./agent";
import { 
  MASTERCHEF_ABI,
  MASTERCHEF_ADDRESS,
  IBEP20_ABI
 } from "./constants";
import { BotConfig } from "./config";
import { createFinding } from "./findings";

describe("Large Pancakeswap LP Token Deposit/Withdraw test suite", () => {

  const mockProvider = new MockEthersProvider();


  // Static mode
  describe("STATIC mode", () => {
    const testStaticConfig: BotConfig = {
      mode: "STATIC",
      thresholdData: BigNumber.from("1000000000000000000") // 1
    };

    const handleTransaction: HandleTransaction = provideHandleTransaction(testStaticConfig);

    it("Should return 0 findings in empty transactions", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();
      const findings : Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large deposit event", async () => {
      const testSpender: string = createAddress("0x1");
      
      const masterchefInterface : ethers.utils.Interface = new ethers.utils.Interface(MASTERCHEF_ABI);
      const depositLog = masterchefInterface.encodeEventLog(
        masterchefInterface.getEvent('Deposit'),
        [
          testSpender, 10, BigNumber.from("2000000000000000000") // 2
        ]
      )
      // Create test transaction event
      const txEvent : TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);
      
      const findings : Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual(
          [
            Finding.fromObject({
            name: "Large LP Token Deposit",
            description: `Deposit event emitted in Masterchef contract for pool 10, Pancake LPs token with a large amount`,
            alertId: "CAKE-1",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            protocol: "PancakeSwap",
            metadata: {
                user: testSpender,
                token: 'Pancake LPs',
                pid: '10',
                amount: "2000000000000000000"
            },
          })
        ]
      )
    });

    it("Should not detect a deposit event under the threshold", async () => {
      const testSpender: string = createAddress("0x1");
      
      const masterchefInterface : ethers.utils.Interface = new ethers.utils.Interface(MASTERCHEF_ABI);
      const depositLog = masterchefInterface.encodeEventLog(
        masterchefInterface.getEvent('Deposit'),
        [
          testSpender, 10, BigNumber.from("500000000000000000") // 0.5
        ]
      )

      const txEvent : TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);
      
      const findings : Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([])
    })

    it("Should detect a large withdrawal event", async () => {
      const testSpender: string = createAddress("0x2");
      
      const masterchefInterface : ethers.utils.Interface = new ethers.utils.Interface(MASTERCHEF_ABI);
      const withdrawLog = masterchefInterface.encodeEventLog(
        masterchefInterface.getEvent('Withdraw'),
        [
          testSpender, 5, BigNumber.from("1100000000000000000") // 1.1
        ]
      )
      // Create test transaction event
      const txEvent : TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);
      
      const findings : Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual(
          [
            Finding.fromObject({
            name: "Large LP Token Withdrawal",
            description: `Withdraw event emitted in Masterchef contract for pool 5, Pancake LPs token with a large amount`,
            alertId: "CAKE-2",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            protocol: "PancakeSwap",
            metadata: {
                user: testSpender,
                token: 'Pancake LPs',
                pid: '5',
                amount: "1100000000000000000"
            },
          })
        ]
      )
    });

    it("Should not detect a withdrawal event under the threshold", async () => {
      const testSpender: string = createAddress("0x2");
      
      const masterchefInterface : ethers.utils.Interface = new ethers.utils.Interface(MASTERCHEF_ABI);
      const withdrawLog = masterchefInterface.encodeEventLog(
        masterchefInterface.getEvent('Withdraw'),
        [
          testSpender, 5, BigNumber.from("900000000000000000") // 0.9
        ]
      )
      // Create test transaction event
      const txEvent : TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);
      
      const findings : Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([])
    })


  })










})