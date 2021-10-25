import LRU from 'lru-cache'
import Web3 from 'web3'
import {AbiItem} from 'web3-utils'
import {createAddress,  FindingGenerator, decodeParameters} from 'forta-agent-tools'
import {Finding, FindingSeverity, FindingType} from 'forta-agent'

const marketsCache = new LRU(({max: 10_000}))
 
const comptrollerAbi = [{
    constant:true,
    inputs:[],
    type:'function',
    name:"getAllMarkets",
    outputs:[{"name":"","type":"address[]"}]
}] as AbiItem[]

export const getAllMarkets = async (web3: Web3, blockNumber: number | string = 'latest') : Promise<string[]> => {
    
    if (blockNumber!=='latest' && marketsCache.get(blockNumber) !== undefined ){
        return marketsCache.get(blockNumber) as any;
    }   
    
    const comptrollerContract = new web3.eth.Contract(comptrollerAbi, COMPOUND_COMPTROLLER_ADDRESS);
    const markets: string[] = await comptrollerContract.methods.getAllMarkets().call({},blockNumber);
    marketsCache.set(blockNumber, markets);

    return markets;
} 

export const createFindingDetectNewComptrollerImplementation : FindingGenerator = (metadata: {[key:string] : any} | undefined) => {
    const { 1: newImplementationAddress} = decodeParameters(
      ['address', 'address'],
      metadata?.data
    );
    
    return Finding.fromObject({
      name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
      description: 'Update implementation logic for Compound Comptroller',
      alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_1,
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: 'Compound',
      metadata: {
        newAddress: newImplementationAddress
      }
    })
  }
  
export const createFindingNewCTokenImplementation: FindingGenerator = (metadata: {[key:string]: any} | undefined) => {
    const { 1: newImplementationAddress} = decodeParameters(
      ['address', 'address'],
      metadata?.data
    );
    
    return Finding.fromObject({
      name: 'CTOKEN NEW IMPLEMENTATION EVENT',
      description: 'Update implementation logic for a market on Compound',
      alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_2,
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: 'Compound',
      metadata: {
        newAddress: newImplementationAddress
      }
    })
  }
  
export const COMPOUND_COMPTROLLER_ADDRESS = '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'
export const NEW_IMPLEMENTATION_SIGNATURE = 'NewImplementation(address,address)'
export const NEW_IMPLEMENTATION_EVENT_ALERT_ID_1 = 'Vesper-7-1'
export const NEW_IMPLEMENTATION_EVENT_ALERT_ID_2 = 'Vesper-7-2'
export const MOCKADDRESS = createAddress('0x0')
export const OLDADDRESS1 = createAddress('0x1')
export const NEWADDRESS1 = createAddress('0x2')
export const OLDADDRESS2 = createAddress('0x3')
export const NEWADDRESS2 = createAddress('0x4')
export const MARKET1 = createAddress('0x5')
export const MARKET2 = createAddress('0x6')