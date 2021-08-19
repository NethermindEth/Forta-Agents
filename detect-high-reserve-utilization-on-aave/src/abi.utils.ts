import Web3 from 'web3';

const web3 = new Web3();

export const getReserveDataReturnTypes = [
    'uint256',
    'uint256',
    'uint256',
    'uint256',
    'uint256',
    'uint256',
    'uint256',
    'uint256',
    'uint256',
    'uint40',
];

export const decodeGetReserveDataReturn = (returnData: string) => {
    return web3.eth.abi.decodeParameters(getReserveDataReturnTypes, returnData);
}

export const encodeGetReserveDataCall = (assetAddress: string): string => {
    return web3.eth.abi.encodeFunctionCall({
        name: "getReserveData",
        type: "function",
        inputs: [
            {
                type: "address",
                name: "asset"
            }
        ]
    }, [assetAddress]);
}