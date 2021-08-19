import Web3 from "web3";
import {
  encodeGetReserveDataCall,
  decodeGetReserveDataReturn,
} from "./abi.utils";


export default class ReserveUtilizationGetter {
  readonly web3: Web3;
  readonly AAVE_PROTOCOL_DATA_PROVIDER =
    "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d";

  constructor(web3: Web3) {
    this.web3 = web3;
  }

  async getUtilization(assetAddress: string): Promise<bigint> {
    const encodedData: string = encodeGetReserveDataCall(assetAddress);
    const encodedReturn: string = await this.web3.eth.call({
      from: this.AAVE_PROTOCOL_DATA_PROVIDER,
      data: encodedData,
    });
    const decodedReturnValues = decodeGetReserveDataReturn(encodedReturn);
    const [availableLiquidity, totalDebStable, totalDebVar]: bigint[] = Object.values(decodedReturnValues).map(x => BigInt(x));
    const totalDebt = totalDebStable + totalDebVar;
    return totalDebt * BigInt(100) / (totalDebt + availableLiquidity);
  }
}
