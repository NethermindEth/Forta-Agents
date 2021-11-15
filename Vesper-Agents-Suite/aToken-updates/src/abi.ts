import { AbiItem } from "web3-utils"

const GET_ALL_ATOKENS: AbiItem = {
  name: "getAllATokens",
  type: "function",
  inputs: [],
  outputs: [{
    name: "tokens",
    type: "struct[]",
    components:[{
        name: "symbol",
        type: "string",
      }, {
        name: "address",
        type: "address",
    }]
  }],
};

export default {
  GET_ALL_ATOKENS,
};
