import { 
  createAddress, 
  encodeFunctionCall, 
  encodeParameters,
} from "forta-agent-tools";
import { when } from "jest-when";
import abi from "./abi";
const axios = require("axios");
jest.mock("axios");

const ZERO: string = createAddress('0x0');
const POOL_ACCOUNTANT: string = createAddress('0x21');
const CONTROLLER: string = createAddress('0xdead');

const POOLS_V2: string[] = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
  createAddress("0x4"),
];
const POOLS_V3: string[] = [
  createAddress("0x5"),
  createAddress("0x6"),
  createAddress("0x7"),
  createAddress("0x8"),
];
const POOLS: string[] = [
  ...POOLS_V2, 
  ...POOLS_V3,
];
const STRATEGIES_V2: string[] = [
  createAddress("0x9"),
  createAddress("0x10"),
  createAddress("0x11"),
  createAddress("0x12"),
];
const STRATEGIES_V3: string[] = [
  createAddress("0x13"),
  createAddress("0x14"),
  createAddress("0x15"),
  createAddress("0x16"),
  createAddress("0x17"),
  createAddress("0x18"),
  createAddress("0x19"),
  createAddress("0x20"),
];
const STRATEGIES: string[] = [
    ...STRATEGIES_V2,
    ...STRATEGIES_V3,
];


function mockPoolList(){
  const poolData: any = [];
  POOLS.forEach((pool) => {
    const value =  {
      contract: {
        address: pool,
      },
      status: "operative",
      stage: "prod"
    }
    poolData.push(value)
  });
  const pools = {
    data: {
      pools: poolData
    },
  } as any;
  (axios.get as jest.Mock).mockResolvedValue(pools);
}


function initMock(mock: any, block: string | number = "latest"): void {
  mockPoolList();

  // V2 strategies
  for(let i = 0; i < POOLS_V2.length; ++i){
    when(mock).calledWith({
        to: CONTROLLER, 
        data: encodeFunctionCall(abi.STRATEGY, [POOLS_V2[i]]),
      }, 
      block,
    ).mockReturnValue(encodeParameters(abi.STRATEGY.outputs as any[], [STRATEGIES_V2[i]]));
  }

  // V3 strategies
  for(let i = 0; i < POOLS_V3.length; ++i){
    // controller strategy should return 0 for all V3 pools
    when(mock).calledWith({
        to: CONTROLLER, 
        data: encodeFunctionCall(abi.STRATEGY, [POOLS_V3[i]]),
      }, 
      block,
    ).mockReturnValue(encodeParameters(abi.STRATEGY.outputs as any[], [ZERO]));
    // each pool should return its strategies
    when(mock).calledWith({
        to: POOLS_V3[i], 
        data: encodeFunctionCall(abi.GET_STRATEGIES, []),
      }, 
      block,
    ).mockReturnValue(encodeParameters(abi.GET_STRATEGIES.outputs as any[], [[
      STRATEGIES_V3[i * 2],
      STRATEGIES_V3[i * 2 + 1],
    ]]));
    // each pool should return its poolAccountant
    when(mock).calledWith({
        to: POOLS_V3[i], 
        data: encodeFunctionCall(abi.PoolABI, []),
      }, 
      block,
    ).mockReturnValue(encodeParameters(abi.PoolABI.outputs as any[], [POOL_ACCOUNTANT]));

    for(let j = 0; j < STRATEGIES_V3.length; ++j){
    //  poolAccountant to return strategy config
    when(mock).calledWith({
        to: POOL_ACCOUNTANT, 
        data: encodeFunctionCall(abi.Accountant_ABI, [STRATEGIES_V3[j]]),
      }, 
      block
    ).mockReturnValue(encodeParameters(abi.Accountant_ABI.outputs as any[], 
      [true,1,1,1,1,1,1,1]));
    }
  }
};

export default {
    CONTROLLER,
    POOLS_V2,
    POOLS_V3,
    POOLS,
    STRATEGIES_V2,
    STRATEGIES_V3,
    STRATEGIES,
    initMock,
};
