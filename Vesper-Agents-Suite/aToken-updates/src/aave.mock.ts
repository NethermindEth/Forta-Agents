import { when } from "jest-when";
import { createAddress, encodeFunctionCall, encodeParameters } from "forta-agent-tools";
import { TokenData } from "./aave.fetcher";
import abi from "./abi";

const PROVIDER: string = createAddress("0xdead");
const TOKENS: TokenData[] = [
  {symbol: "aToken0", address: createAddress("0x0")},
  {symbol: "aToken1", address: createAddress("0x1")},
  {symbol: "aToken2", address: createAddress("0x2")},
  {symbol: "aToken3", address: createAddress("0x3")},
  {symbol: "aToken4", address: createAddress("0x4")},
];
const TOKENS_AT_BLOCK_3 = TOKENS.slice(2);

function initMock(mock: any) {
  when(mock).calledWith({
      to: PROVIDER,
      data: encodeFunctionCall(abi.GET_ALL_ATOKENS, []),
    }, 
    "latest",
  ).mockReturnValue(encodeParameters(
    abi.GET_ALL_ATOKENS.outputs as any[], 
    [TOKENS]
  ));

  when(mock).calledWith({
      to: PROVIDER,
      data: encodeFunctionCall(abi.GET_ALL_ATOKENS, []),
    }, 
    3,
  ).mockReturnValue(encodeParameters(
    abi.GET_ALL_ATOKENS.outputs as any[], 
    [TOKENS_AT_BLOCK_3]
  ));
};

export default {
  PROVIDER,
  TOKENS,
  TOKENS_AT_BLOCK_3,
  initMock,
};
