import { 
  createAddress, 
  encodeFunctionCall, 
  encodeParameters,
} from "forta-agent-tools";
import { when } from "jest-when";
import abi from "./abi";

const ZERO: string = createAddress('0x0');
const CONTROLLER: string = createAddress('0xdead');
const ADDRESS_LIST: string = createAddress('0xffff');

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

function initMock(mock: any): void {
  // Return pool list
  when(mock).calledWith({
      to: CONTROLLER, 
      data: encodeFunctionCall(abi.POOLS, []),
    }, 
    "latest",
  ).mockReturnValue(encodeParameters(abi.POOLS.outputs as any[], [ADDRESS_LIST]));

  // Pool length
  when(mock).calledWith({
      to: ADDRESS_LIST, 
      data: encodeFunctionCall(abi.LENGHT, []),
    }, 
    "latest",
  ).mockReturnValue(encodeParameters(abi.LENGHT.outputs as any[], [POOLS.length]));

  // // Pools addresses
  for(let i = 0; i < POOLS.length; ++i){
    when(mock).calledWith({
        to: ADDRESS_LIST, 
        data: encodeFunctionCall(abi.AT, [i.toString()]),
      }, 
      "latest",
    ).mockReturnValue(encodeParameters(abi.AT.outputs as any[], [POOLS[i], "1"]));
  }

  // // V2 strategies
  for(let i = 0; i < POOLS_V2.length; ++i){
    when(mock).calledWith({
        to: CONTROLLER, 
        data: encodeFunctionCall(abi.STRATEGY, [POOLS_V2[i]]),
      }, 
      "latest",
    ).mockReturnValue(encodeParameters(abi.STRATEGY.outputs as any[], [STRATEGIES_V2[i]]));
  }

  // // V3 strategies
  for(let i = 0; i < POOLS_V3.length; ++i){
    // controller strategy should return 0 for all V3 pools
    when(mock).calledWith({
        to: CONTROLLER, 
        data: encodeFunctionCall(abi.STRATEGY, [POOLS_V3[i]]),
      }, 
      "latest",
    ).mockReturnValue(encodeParameters(abi.STRATEGY.outputs as any[], [ZERO]));
    // each pool should return its strategies
    when(mock).calledWith({
        to: POOLS_V3[i], 
        data: encodeFunctionCall(abi.GET_STRATEGIES, []),
      }, 
      "latest",
    ).mockReturnValue(encodeParameters(abi.GET_STRATEGIES.outputs as any[], [[
      STRATEGIES_V3[i * 2],
      STRATEGIES_V3[i * 2 + 1],
    ]]));
  }
};

export default {
    CONTROLLER,
    ADDRESS_LIST,
    POOLS_V2,
    POOLS_V3,
    POOLS,
    STRATEGIES_V2,
    STRATEGIES_V3,
    STRATEGIES,
    initMock,
};
