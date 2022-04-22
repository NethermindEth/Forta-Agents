import { BigNumberish, BigNumber } from "ethers";
import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";
import { getCreate2Address as create2 } from "@ethersproject/address";
import { utils } from "ethers";

type Desc = utils.TransactionDescription;

const V2_FACTORY: string = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f";
const V3_FACTORY: string = "0x1f98431c8ad98523631ae4a59f267346ea31f984";

const V2_PAIR_INIT_CODE: string = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
const V3_PAIR_INIT_CODE: string = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

const v2Create2 = (token0: string, token1: string) => {
  const salt: string = keccak256(token0.concat(token1.slice(2)));
  return create2(V2_FACTORY, salt, V2_PAIR_INIT_CODE);
};

const v3Create2 = (token0: string, token1: string, fee: BigNumberish) => {
  const salt: string = keccak256(
    defaultAbiCoder.encode(
      ["address", "address", "uint24"],
      [token0, token1, fee],
    )
  );
  return create2(V3_FACTORY, salt, V3_PAIR_INIT_CODE);
};

type Evaluator = (_: any) => number;

const fixedValue = (value: number) => (_: Desc) => value;

const V2_MAP: Record<string, Evaluator> = {
  "mint": fixedValue(1),
  "burn": fixedValue(1),
  "skim": fixedValue(1),
  "swap": (desc: Desc) => {
    if((desc.args.data === "0x") || BigNumber.from(desc.args.data).eq(0))
      return 1;
    return 2;
  },
};

const v2Transfers = (desc: Desc) => V2_MAP[desc.name](desc);

const V3_MAP: Record<string, Evaluator> = {
  "mint": fixedValue(1),
  "burn": fixedValue(1),
  "collect": fixedValue(1),
  "collectProtocol": fixedValue(1),
  "swap": fixedValue(1),
  "flash": fixedValue(2),
};

const v3Transfers = (desc: Desc) => V3_MAP[desc.name](desc);

export default {
  v2Create2,
  v3Create2,
  v2Transfers,
  v3Transfers,
};
