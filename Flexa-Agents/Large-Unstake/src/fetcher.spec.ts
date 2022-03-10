import Fetcher from "./fetcher"
import { Interface } from "@ethersproject/abi";
import { createAddress, MockEthersProvider } from 'forta-agent-tools';
import utils from "./utils";
import { keccak256 } from "forta-agent/dist/sdk/utils";

const FLEXA_IFACE: Interface = new Interface(utils.FLEXA_ABI);

//partition address, block number, isPartition
const CASES: [string, number, boolean][] = [
    [keccak256("csfkfdsk"), 13, true],
    [keccak256("ooooooo"), 14, false],
    [keccak256("dfdsf9ssf"), 15, true],
    [keccak256("dfdsf9ssf"), 16, false]
];

describe("Fetcher test suite", () => {
    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const amp: string = createAddress("0xdade");
    const flexa: string = createAddress("0xdead");
    const fetcher: Fetcher = new Fetcher(amp, flexa, mockProvider as any);
    
    beforeEach(() => {
        mockProvider.clear();    
    });

    it("should set the amp contract correctly", async () => {
        for(let i = 0; i < 10; ++i){
        const addr: string = createAddress(`0xfff${i}`);
        const fetcher: Fetcher = new Fetcher(addr, flexa, mockProvider as any);
        expect(fetcher.amp).toStrictEqual(addr);
        }
    });

    it("should set the flexa collateral manager correctly", async () => {
        for(let i = 0; i < 10; ++i){
        const addr: string = createAddress(`0xfff${i}`);
        const fetcher: Fetcher = new Fetcher(amp, addr, mockProvider as any);
        expect(fetcher.flexa).toStrictEqual(addr);
        }
    });

    it("should return true (false) when isPartition is called with an address that is (is not) a partition", async () => {        
        for(let [partition, block, isPartition] of CASES) {
            mockProvider.addCallTo(flexa, block, FLEXA_IFACE, 'partitions', { inputs: [partition], outputs: [isPartition]});        
            const value: boolean = await fetcher.isPartition(block, partition);
            expect(value).toStrictEqual(isPartition);
            //  clear mock and use cached values
            mockProvider.clear();
            expect(value).toStrictEqual(isPartition);  
        }                      
    })
})