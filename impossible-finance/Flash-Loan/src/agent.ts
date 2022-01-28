import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
} from 'forta-agent';

const { ethers } = require('ethers');

// Global variables
let PAIRS: string[] = [];
const SWAP_FACTORY_V1_ADDRESS = '0x918d7e714243F7d9d463C37e106235dCde294ffC';
const SWAP_FACTORY_V1_ABI = [
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)",
]

const initialize = async () => {
  // Different initialize logic if testing to save time
  // If `testing` is true then a pre-set PAIRS array rather than loading from on-chain source
  const testing = true;
  if(testing) {
    PAIRS = [
      '0x438A242B9774c6D562d43fA2c1410dc9d9dE3281',
      '0x751c835A04DC3D71B085263800488A59Cbf48dfE',
      '0x49aF52c3387408FbdDc5e6DA8711547C9a824F0d',
      '0x43538b9E1E1D3Bb420727Ff4693744D515c90D53',
      '0x622413599365fE27FEc266743Ef0c6443fb5971a',
      '0xf6149E4119877BA5D876aC053e9Bd014f75DBE61',
      '0xcC99cA7487334145740980fb01E0Bcaf4F7C618B',
      '0x01552AdE51DaffEF16B31a08aEa2ff3dd56a9758',
      '0x596153012423c0EC40df98B2C2bE57262e748872',
      '0xbcc87CA66106FBd7a263A5C4969933998cE13C1B',
      '0xE9053a22BB6D9dF394b89879bD803C80E4701feA',
      '0x8B0768492d9698D061aa7Fb3BD5fd0f7E21267bb',
      '0x04d0d3F05ab5658167e68cF6a3815357d8C33e5f',
      '0x6C9E5Ec3b923E09B6946e33B76eA686B780C7BaB',
      '0x4406FA5a7D32378691E151FB35fd5F4e2B45cd98',
      '0xEeF28d9d60cF5CdCF4234322838E644D190A2c29',
      '0x0199beF6364fa22F107836Ef47351e50585A5adA',
      '0x22ec378bC7569Ba27eD746842c696E3C725bb91e',
      '0xBd3c1939E52d33d9BBCFAa1Bb90d0AB5E1F4b1db',
      '0xD869A70BcB00f8C2Df0CF8eE173738AbACBe4643',
      '0xa37f6483cC3E149dFE212350eF8Cf8BAB0240357',
      '0xEf0a74DB16222fA59b25f363D97b1f5705c61afD',
      '0x631c4cbC4410439B2b310b8c674aD6058D680c47',
      '0x13d80EFD9F4EC6Ef7279fE10124CeBf58C0D07C2',
      '0x509aC694d17cc1348FFb102A8015be77A059aeef',
      '0xcbe99A0564aE357d4b95244680ac08a0c1959571',
      '0xC14D8a06fa0B1978d281EFb3b1061f8437E4bf07',
      '0x21f4B8f0a48655DcEE33f75a878017Ed44bC3192',
      '0xcfa5aF9B5fB0F9a8E8c7752e70B58de1464CfA42',
      '0x16FCDd239bA1347cBa90A7acaA1e3c1F83444353',
      '0x68a37e14D080436B57119e379a04d32F4CA7f92d',
      '0xf1f52f33aBab0629EC8657C330ad556824B844E1',
      '0xB5ceFC854801Bc6976B76dc34e2A986556F3cd11',
      '0x1bfE758d6061c6A221437b2C673F27876B1E3416',
      '0x7eaa8065e807De6D30B9916fE49d638127C41e9B',
      '0x5316e743816223b335764738021F3Df7a17a25dA',
      '0x8060D907b5E4560cfd015Dcb97Eec8cDa30E0A41',
      '0x344227170cE534C5F01f9ED7ABE808C2C71E1f9C',
      '0xd5B1998b4c4aE0fdC663A79a8D418EB0109b5e3B',
      '0xF292d0b680BA116f45e745Bf62e78aeA49C45232',
      '0x498d6BF9a68F9f1f6071565992a65deB4867ab76',
      '0x5706C6F65DF3D2f2018FA174eA3db3789d820c01',
      '0x80B30E92bF77d6CC4eF1ca5d379231d873AA37C5',
      '0x2846ea59fc89a0d82832BEDa3419044FFFE76268',
      '0xD1D8fF40f3F860891E8f388C1cd3A05D30e0b990',
      '0x205437CD44185Ca198C305d8137e6e0133135a55',
      '0x0B224B89eB0d6C5CF6B24F69bEB4Cf81E13aC5cC',
      '0x7f6b16604A0df3D48BACb39B742494C63c1612DC',
      '0xc87FC511C6360224D12fdb37f199Fc299FB9D882',
      '0x050d5Baa695521f13E3C810FE19D5315F94812E5',
      '0x4F14192A78356b6218d7dD6499ae7762879dcD61',
      '0xf105Baf1fED1C270D54B86a23CC653CE464e189d',
      '0xCD254486Fb8F5A776D8780504b87A55b80C669DC',
      '0xa580dBa16baC9a5B71F111BCdd60Baa7addF0A60',
      '0x2441Bf251ab479E3AFE85DC99080074507F81d95',
      '0xa5ac52e99D7E6e03F960AA91dD0f5b51918083fB',
      '0x5bc951c2948F4049Fe7A643Ce75423702F0f2702',
      '0x68b01321e1A08999dd4dCfce45E0af978979122b',
      '0x744571469De64e4aa28fa60F39A7F5AAF28628fD',
      '0x0b7601feA2510B8bf6E70333627aEA460dA36B40',
      '0xF6a86849Ccd12245d942d045e3A9BDCAF36D18AB',
      '0xc5B2EccB9217c36A6dE0084807Af7B77B8f38456',
      '0x7902Dd85C8E786441c9DfeD03e9Ad6dF61E89acC',
      '0x15018e379101ceFCa6f3B71BE79aAa8F1ddEB7ed',
      '0xe6A97E7B5EB2FA72A8B4BeDaaf4CdE85E015DAbf',
      '0x1E29C91C72c597BE1f267FA143e4f134b7611963',
      '0xBac1DF34cC02cDbcc233fDb2873A9eAce5414681',
      '0xFE985c01C3792Af558D3F9de93A555655826a94d',
      '0x149c77e8cc741b534596b667D3F5F8B0440fe301',
      '0x455379Fa0c7b84e93a38c06d24269DF102F88199',
      '0x8fbBC91849e723C6b29642eFD78c9134049E72Ed',
      '0x3fa81B81e0381ec150757e1F5CD98A98b288BB6f',
    ]
  } else {
    // Interact with the Swap Factory contract to get the total number of pairs
    const provider = getEthersProvider();
    const contract = new ethers.Contract(SWAP_FACTORY_V1_ADDRESS, SWAP_FACTORY_V1_ABI, provider);
    const numPairs = await contract.allPairsLength();
    let i = ethers.BigNumber.from(0);
    // Get each pair address and add it to the array `PAIRS`
    while(i.lt(numPairs)) {
      PAIRS[i] = await contract.allPairs(i.toString());
      const pairIndex = i.add(1).toString();
      console.log(i.add(1).toString() + '/' + numPairs.toString());
      i = i.add(ethers.BigNumber.from(1));
    }
  }
}

// The handle transaction function
const handleTransaction = async (
  txEvent: TransactionEvent
) => {
  // Set up the findings array
  const findings: Finding[] = [];
  // Check if new pair has been deployed
  const pairCreatedEvents = txEvent.filterLog(SWAP_FACTORY_V1_ABI[0], SWAP_FACTORY_V1_ADDRESS);
  for(let i = 0; i < pairCreatedEvents.length; i++) {
    // Get the newly created pair address and add it to the `PAIRS` array
  }
  // For each pair
  for(let i = 0; i < PAIRS.length; i++) {
    // Get all times `swap` has been called on the pair
    const pairSwapAbi = 'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)';
    const pairSwaps = txEvent.filterFunction(pairSwapAbi, PAIRS[i]);
    // For every `swap` function call
    for(let j = 0; j < pairSwaps.length; j++) {
      // Check if the `data` parameter is non-zero
      // If it is non-zero then it is a flashloan
      // Create a finding
    }
  }
  return findings;
}

// Export needed functions
export default {
  initialize,
  handleTransaction,
}
