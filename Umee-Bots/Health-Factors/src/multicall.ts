import { Contract } from "@ethersproject/contracts";
import { multicallAbi } from "ethers-multicall/dist/abi/multicall";
import { Abi } from "ethers-multicall/dist/abi";
import { Contract as MulticallContract, ContractCall, Provider } from "ethers-multicall";
import { Provider as EthersProvider } from "@ethersproject/providers";

// Provider class heavily based on ethers-multicall, but supporting specifying
// a blockTag for the multicall contract call.

class MulticallProvider extends Provider {
  constructor(provider: EthersProvider, chainId?: number) {
    super(provider, chainId);
  }

  public async all<T extends any[] = any[]>(calls: ContractCall[], blockTag?: number | string) {
    // @ts-ignore
    if (!this._provider) {
      throw new Error("Provider should be initialized before use.");
    }
    // @ts-ignore
    return this._all<T>(calls, this._multicallAddress, this._provider, blockTag);
  }

  private async _all<T extends any[] = any[]>(
    calls: ContractCall[],
    multicallAddress: string,
    provider: EthersProvider,
    blockTag?: number | string
  ): Promise<T> {
    const multicall = new Contract(multicallAddress, multicallAbi, provider);

    const requests = calls.map((call) => ({
      target: call.contract.address,
      callData: Abi.encode(call.name, call.inputs, call.params),
    }));

    const response = await multicall.aggregate(requests, { blockTag });

    const results = [];

    for (let i = 0; i < calls.length; i++) {
      const outputs = calls[i].outputs;
      const returnData = response.returnData[i];
      const params = Abi.decode(outputs, returnData);
      const result = outputs.length === 1 ? params[0] : params;

      results.push(result);
    }

    return results as T;
  }
}

export { MulticallContract, MulticallProvider };
