interface NetworkData {
  address: string;
  num: number;
}
const data: Record<number, NetworkData> = {
  42161: {
    address: "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064",
    num: 1,
  },
  43114: {
    address: "0x5f719c2f1095f7b9fc68a68e35b51194f4b6abe8",
    num: 2,
  },
};
const SWAP_EVENT =
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)";

//Represents the calls that will be stored to check for frontrunning. A bigger value makes sure no cases are ignored but makes the bot less efficient
const CALL_HISTORY_SIZE = 20;

export default {
  data,
  SWAP_EVENT,
  CALL_HISTORY_SIZE,
};
