import {
  Finding,
  TransactionEvent
} from "forta-agent";
import { createAddress, encodeParameter, TestTransactionEvent } from "forta-agent-tools";
import abi from "./abi";
import { provideHandleTransaction } from "./agent";
import DataFetcher from "./fetcher";
import Mock, { Methods } from "./mock";
import withdraw from "./withdraw";
import {
  createDepositFinding,
  createWithdrawFinding,
  traceData,
} from "./utils";
import BigNumber from "bignumber.js";

const provider = createAddress("0xdead");
const percent = 10;

const vaultsData: any[] = [{
    vault: createAddress("0xa1"),
    supply: 200,  // 20 is a large withdraw
    deposit: 200, //
    debt: 99,     // 10 is a large deposit
    balance: 1,   //
    token: createAddress("0xc1"),
  },{
    vault: createAddress("0xa2"),
    supply: 2000,  // 200 is a large withdraw
    deposit: 1000, //
    debt: 0,       // 90 is a large deposit
    balance: 100,  //
    token: createAddress("0xc2"),
  },
];
const sender1: string = createAddress("0xa1");
const sender2: string = createAddress("0xa2");
const recipient: string = createAddress("0xb1");
const fakeVault: string = createAddress("0xffff");
const zeroAddr: string = createAddress("0x0");

const registerBlock = (mock: Mock, block: number): void => {
  mock
    .registerContract(abi.PROVIDER, provider)
    .registerCall(Methods.ASSETS, vaultsData.map(v => v.vault), block);
  for(let data of vaultsData){
    mock
      .registerContract(abi.VAULT, data.vault)
      .registerContract(abi.TOKEN, data.token)
      .registerCall(Methods.SUPPLY, data.supply, block - 1)
      .registerCall(Methods.DEPOSIT, data.deposit, block - 1)
      .registerCall(Methods.DEBT, data.debt, block - 1)
      .registerCall(Methods.TOKEN, data.token, block - 1)
      .registerCall(Methods.BALANCE, data.balance, block - 1, data.vault);
  }
}

describe("Large Deposit/Withdraw agent test suite", () => {
  const mockWeb3: Mock = new Mock();
  const mockFetcher: DataFetcher = new DataFetcher(mockWeb3);
  const handler = provideHandleTransaction(provider, percent, mockFetcher);  

  beforeEach(() => { mockWeb3.clear() });

  it("should detect large deposits", async () => {
    registerBlock(mockWeb3, 10);
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(10)
      .addTraces(
        traceData(vaultsData[0].vault, sender1, "100", recipient), // large
        traceData(vaultsData[1].vault, sender2, "10", recipient),
        traceData(vaultsData[0].vault, sender1, "10", recipient),  // large
        traceData(vaultsData[1].vault, sender2, "90", recipient),  // large
        traceData(vaultsData[1].vault, sender2, "100", recipient), // large
        traceData(vaultsData[0].vault, sender1, "1", recipient),
        traceData(vaultsData[0].vault, sender1, "9", recipient),
        traceData(fakeVault, sender2, "2000", recipient),
        traceData(vaultsData[1].vault, sender2, "89", recipient),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createDepositFinding(vaultsData[0].vault, sender1, recipient, "100"),
      createDepositFinding(vaultsData[0].vault, sender1, recipient, "10"),
      createDepositFinding(vaultsData[1].vault, sender2, recipient, "90"),
      createDepositFinding(vaultsData[1].vault, sender2, recipient, "100"),
    ]);

  });

  it("should detect large withdraws", async () => {
    registerBlock(mockWeb3, 20);
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(20)
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        vaultsData[0].vault,
        encodeParameter('uint256', new BigNumber(20)),     // large
        encodeParameter('address', createAddress("0x1")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        vaultsData[0].vault,
        encodeParameter('uint256', new BigNumber(19)),
        encodeParameter('address', createAddress("0x2")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        vaultsData[0].vault,
        encodeParameter('uint256', new BigNumber(210)),    // large
        encodeParameter('address', createAddress("0x3")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        vaultsData[1].vault,
        encodeParameter('uint256', new BigNumber(1)),    
        encodeParameter('address', createAddress("0x3")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        vaultsData[1].vault,
        encodeParameter('uint256', new BigNumber(199)),    
        encodeParameter('address', createAddress("0x3")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        vaultsData[1].vault,
        encodeParameter('uint256', new BigNumber(215)),    // large
        encodeParameter('address', createAddress("0x3")),
        encodeParameter('address', zeroAddr),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createWithdrawFinding(vaultsData[0].vault, createAddress("0x1"), new BigNumber(20)),
      createWithdrawFinding(vaultsData[0].vault, createAddress("0x3"), new BigNumber(210)),
      createWithdrawFinding(vaultsData[1].vault, createAddress("0x3"), new BigNumber(215)),
    ]);
  });

  it("should detect both events", async () => {
    registerBlock(mockWeb3, 20);
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(20)
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        vaultsData[0].vault,
        encodeParameter('uint256', new BigNumber(20)),     // large
        encodeParameter('address', createAddress("0x1")),
        encodeParameter('address', zeroAddr),
      )
      .addTraces(traceData(vaultsData[1].vault, sender1, "100", recipient)); // large
    
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createDepositFinding(vaultsData[1].vault, sender1, recipient, "100"),
      createWithdrawFinding(vaultsData[0].vault, createAddress("0x1"), new BigNumber(20)),
    ]);
  })
});
