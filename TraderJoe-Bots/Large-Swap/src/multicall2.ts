import { Contract } from "@ethersproject/contracts";
import { Abi } from "ethers-multicall/dist/abi";
import { Contract as MulticallContract, ContractCall, Provider, setMulticallAddress } from "ethers-multicall";
import { Provider as EthersProvider } from "@ethersproject/providers";
import { MULTICALL2_ABI } from "./utils";

// Provider class heavily based on ethers-multicall, but supporting specifying
// a blockTag for the multicall contract call.

class MulticallProvider extends Provider {
  constructor(provider: EthersProvider, multicallAddress: Record<number, string>, chainId?: number) {
    // clean ethers-multicall Multicall addresses list so a Multicall contract is not called by mistake
    const ethersMulticallChains = [1, 3, 4, 5, 42, 56, 66, 97, 100, 128, 137, 250, 1337, 42161, 43114, 80001];
    ethersMulticallChains.forEach((network) => {
      setMulticallAddress(network, undefined as unknown as string);
    });
    for (const [network, address] of Object.entries(multicallAddress)) {
      // setMulticallAddress(network as unknown as number, address);
      setMulticallAddress(parseInt(network), address);
    }
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
    const Multicall2 = new Contract(multicallAddress, MULTICALL2_ABI, provider);
    const requests = calls.map((call) => ({
      target: call.contract.address,
      callData: Abi.encode(call.name, call.inputs, call.params),
    }));
    const response = await Multicall2.callStatic.tryAggregate(false, requests, { blockTag });
    const results = [];
    for (let i = 0; i < calls.length; i++) {
      const outputs = calls[i].outputs;
      const result = response[i];
      const params = Abi.decode(outputs, result.returnData);
      results.push({
        success: result.success,
        returnData: outputs.length === 1 ? params[0] : params,
      });
    }
    return results as T;
  }
}
export { MulticallContract, MulticallProvider };
