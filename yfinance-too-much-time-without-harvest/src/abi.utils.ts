import Web3 from "web3";

const web3 = new Web3();

export const createDataStrategies = (strategyAddress: string): string => {
    return web3.eth.abi.encodeFunctionCall({
        name: "strategies",
        type: "function",
        inputs: [
            {
                type: "address",
                name: "",
            }
        ]
    }, [strategyAddress]);
}