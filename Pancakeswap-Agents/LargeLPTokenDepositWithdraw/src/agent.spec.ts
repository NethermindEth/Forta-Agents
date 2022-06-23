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

// Add mock calls to the provider
const MASTERCHEF_INTERFACE = new ethers.utils.Interface(MASTERCHEF_ABI);
const IBEP20_INTERFACE = new ethers.utils.Interface(IBEP20_ABI);


// Function to set the token address of a certain token in the masterchef account
function addLPTokenAddress(
  mockProvider: MockEthersProvider,
  pid: number,
  tokenAddress: string,
  block: number
) {
  mockProvider.addCallTo(MASTERCHEF_ADDRESS, block, MASTERCHEF_INTERFACE, "lpToken", 
    { inputs: [pid], outputs: [tokenAddress] }
  )
}

// Function to set the name balance of masterchef account at a certian tokenAddress
function addLPTokenNameBalance(
  mockProvider: MockEthersProvider,
  tokenAddress: string,
  tokenName: string,
  balance: ethers.BigNumber,
  block: number,
) {
  mockProvider.addCallTo(tokenAddress, block - 1, IBEP20_INTERFACE, "balanceOf", 
    { inputs: [MASTERCHEF_ADDRESS], outputs: [balance] }
  )
  mockProvider.addCallTo(tokenAddress, block, IBEP20_INTERFACE, "name", 
    { inputs: [], outputs: [tokenName] }
  )
}


describe("Large Pancakeswap LP Token Deposit/Withdraw test suite", () => {

  // Static mode
  describe("STATIC mode", () => {

    let handleTransaction: HandleTransaction;
    let mockProvider: MockEthersProvider;
    let provider: ethers.providers.Provider;

    const testStaticConfig: BotConfig = {
      mode: "STATIC",
      thresholdData: BigNumber.from("1000000000000000000") // 1
    };

    beforeEach( () => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as any;
    });
    

    it("Should return 0 findings in empty transactions", async () => {
       handleTransaction = provideHandleTransaction(testStaticConfig, provider);
      const txEvent: TestTransactionEvent = new TestTransactionEvent();
      const findings : Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large deposit event", async () => {
      
      const txEvent : TestTransactionEvent = new TestTransactionEvent().setBlock(100);

      handleTransaction = provideHandleTransaction(testStaticConfig, provider);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(
        MASTERCHEF_INTERFACE.getEvent('Deposit'),
        [
          testSpender, 10, BigNumber.from("2000000000000000000") // 2
        ]
      )
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress : string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 10, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 2)
      addLPTokenNameBalance(mockProvider, mockTokenAddress, "Test Token 1", ethers.BigNumber.from("2000000000000000000"), 100);
      
      const findings : Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual(
          [
            Finding.fromObject({
            name: "Large LP Token Deposit",
            description: `Deposit event emitted in Masterchef contract for pool 10, Test Token 1 token with a large amount`,
            alertId: "CAKE-1",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            protocol: "PancakeSwap",
            metadata: {
                user: testSpender,
                token: 'Test Token 1',
                pid: '10',
                amount: "2000000000000000000"
            },
          })
        ]
      )
    });

    // it("Should not detect a deposit event under the threshold", async () => {
    //   const testSpender: string = createAddress("0x1");
      
    //   const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(
    //     MASTERCHEF_INTERFACE.getEvent('Deposit'),
    //     [
    //       testSpender, 10, BigNumber.from("500000000000000000") // 0.5
    //     ]
    //   )

    //   const txEvent : TransactionEvent = new TestTransactionEvent()
    //     .addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);
      
    //   const findings : Finding[] = await handleTransaction(txEvent);
    //   expect(findings).toStrictEqual([])
    // })

    // it("Should detect a large withdrawal event", async () => {
    //   const testSpender: string = createAddress("0x2");
      
    //   const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(
    //     MASTERCHEF_INTERFACE.getEvent('Withdraw'),
    //     [
    //       testSpender, 5, BigNumber.from("1100000000000000000") // 1.1
    //     ]
    //   )
    //   // Create test transaction event
    //   const txEvent : TransactionEvent = new TestTransactionEvent()
    //     .addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);
      
    //   const findings : Finding[] = await handleTransaction(txEvent);
    //   expect(findings).toStrictEqual(
    //       [
    //         Finding.fromObject({
    //         name: "Large LP Token Withdrawal",
    //         description: `Withdraw event emitted in Masterchef contract for pool 5, Pancake LPs token with a large amount`,
    //         alertId: "CAKE-2",
    //         severity: FindingSeverity.Info,
    //         type: FindingType.Info,
    //         protocol: "PancakeSwap",
    //         metadata: {
    //             user: testSpender,
    //             token: 'Pancake LPs',
    //             pid: '5',
    //             amount: "1100000000000000000"
    //         },
    //       })
    //     ]
    //   )
    // });

    // it("Should not detect a withdrawal event under the threshold", async () => {
    //   const testSpender: string = createAddress("0x2");
      
    //   const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(
    //     MASTERCHEF_INTERFACE.getEvent('Withdraw'),
    //     [
    //       testSpender, 5, BigNumber.from("900000000000000000") // 0.9
    //     ]
    //   )
    //   // Create test transaction event
    //   const txEvent : TransactionEvent = new TestTransactionEvent()
    //     .addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);
      
    //   const findings : Finding[] = await handleTransaction(txEvent);
    //   expect(findings).toStrictEqual([])
    // })


  })










})