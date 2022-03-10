import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import { BigNumber } from "ethers";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import { AMP_ABI } from "./utils";
import { Interface } from "@ethersproject/abi";

const AMP_IFACE: Interface = new Interface(AMP_ABI);

const PARTITIONS: string[] = [
    keccak256("part1"),
    keccak256("part2"),
    keccak256("part3"),
    keccak256("part4"),
    keccak256("part5"),
    keccak256("part6"),
];

const createFinding = (fromPartition: string, operator: string, fromAddress: string, toAddress: string, value: string): Finding => Finding.fromObject({
  name: "Large FlexaCollateralManager TransferByPartition alert",
  description: "TransferByPartition event emitted with a large value",
  alertId: "FLEXA-3",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Flexa",
  metadata: { fromPartition, operator, fromAddress, toAddress, value },
});

describe("Flexa Collateral Manager large transfer by partition agent test suite", () => {
    const mockIsPartition = jest.fn();
    const FLEXA_CONTRACT: string = createAddress("0xfffd");
    const AMP_CONTRACT: string = createAddress("0xffff");
    const mockFetcher = {
        isPartition: mockIsPartition,
        flexa: FLEXA_CONTRACT,
        amp: AMP_CONTRACT
    }
    const THRESHOLD: BigNumber = BigNumber.from("1000");
    const handler: HandleTransaction = provideHandleTransaction(mockFetcher as any, THRESHOLD);

    beforeEach(() => {
        mockFetcher.isPartition.mockClear();
    });

    it("should report no findings for txs without events", async () => {
        const txEvent: TransactionEvent = new TestTransactionEvent();
        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([]);           
    });

    it("should ignore regular, below the threshold, transfers", async () => {
        when(mockIsPartition)
            .calledWith(38, PARTITIONS[1]).mockReturnValue(true);
            
        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[1], createAddress('0x4567'),  mockFetcher.flexa, createAddress("0x7676"), "324", keccak256("k6543"), keccak256("d4949d")]
        );
        
        const txEvent: TransactionEvent =  new TestTransactionEvent()
            .setBlock(38)
            .addAnonymousEventLog(mockFetcher.amp, log.data, ...log.topics);        

        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([]);

    })

    it("should ignore withdrawal transfers not from FlexaCollateralManager", async () => {
        when(mockIsPartition)
            .calledWith(22, PARTITIONS[4]).mockReturnValue(true);
            
        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[4], createAddress('0x3333'),  createAddress("0x4555"), createAddress("0x4444"), "155324", keccak256("accbbb"), keccak256("ddeedd")]
        );
        
        const txEvent: TransactionEvent =  new TestTransactionEvent()
            .setBlock(22)
            .addAnonymousEventLog(mockFetcher.amp, log.data, ...log.topics)        

        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([]);
    })

    it("should ignore transfers from a non-permitted partition", async () => {
        when(mockIsPartition)
            .calledWith(500, PARTITIONS[3]).mockReturnValue(false);
            
        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[3], createAddress('0xa22a'),  mockFetcher.flexa, createAddress("0x9876"), "155324", keccak256("abbbbb"), keccak256("ddddd")]
        );
        
        const txEvent: TransactionEvent =  new TestTransactionEvent()
            .setBlock(500)
            .addAnonymousEventLog(mockFetcher.amp, log.data, ...log.topics);       

        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([]);
    })

    it("should ignore events not emitted from the amp contract", async () => {
        when(mockIsPartition)
            .calledWith(125, PARTITIONS[5]).mockReturnValue(true);
            
        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[5], createAddress('0xa22a'),  mockFetcher.flexa, createAddress("0x9b76"), "155365", keccak256("abbb"), keccak256("dddwdd")]
        );
        
        const txEvent: TransactionEvent =  new TestTransactionEvent()
            .setBlock(125)
            .addAnonymousEventLog(createAddress("0x8676"), log.data, ...log.topics);        

        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([]);
    })

    it("should detect multiple TransferByPartition events", async () => {
        when(mockIsPartition)
            .calledWith(42, PARTITIONS[0]).mockReturnValue(true)
            .calledWith(42, PARTITIONS[2]).mockReturnValue(true);

        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log1 = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[0], createAddress('0xdead'),  mockFetcher.flexa, createAddress("0xbaba"), "3243223", keccak256("gfgfgf"), keccak256("sasasas")]
        );
        const log2 = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[2], createAddress('0x9898'),  mockFetcher.flexa, createAddress("0x1010"), "99999", keccak256("cdcdcd"), keccak256("apppp")]
        );

        const txEvent: TransactionEvent =  new TestTransactionEvent()
            .setBlock(42)
            .addAnonymousEventLog(mockFetcher.amp, log1.data, ...log1.topics) 
            .addAnonymousEventLog(mockFetcher.amp, log2.data, ...log2.topics);        

        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([
            createFinding(PARTITIONS[0], createAddress("0xdead"), mockFetcher.flexa, createAddress("0xbaba"), "3243223"),  
            createFinding(PARTITIONS[2], createAddress("0x9898"), mockFetcher.flexa,  createAddress("0x1010"), "99999")          
        ]);
    });
});
