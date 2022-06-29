// Test script to interact w the smart contract

import {
    BlockEvent,
    Finding,
    HandleBlock,
    HandleTransaction,
    TransactionEvent,
    FindingSeverity,
    FindingType,
  } from "forta-agent";
  

import { ethers } from "ethers";
//import { getEthersProvider } from "forta-agent";

 // Constants
const MASTERCHEF_ADDRESS = "0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652"; // (note this is the Masterchef v2 contract)

const PoolInfoStruct = "(uint256 accCakePerShare, uint256 lastRewardBlock, uint256 allocPoint, uint256 totalBoostedShare, bool isRegular)";

const MASTERCHEF_ABI = [
    'event Deposit(address indexed user, uint256 indexed pid, uint256 amount)',
    'event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)',
    `function poolInfo(uint256 input) public view returns (tuple${PoolInfoStruct} memory)`,
    'function lpToken(uint256 input) public view returns (address token)', // ??
    'function burnAdmin() public view returns (address)',
    'function poolLength() public view returns (uint256 pools)'
];

const IBEP20_ABI = [
    'function totalSupply() external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function name() external view returns (string memory)',
    'function symbol() external view returns (string memory)'
]


var url = "https://bsc-dataseed1.binance.org/";
var provider = new ethers.providers.JsonRpcProvider(url);

const masterchefInterface = new ethers.Contract(MASTERCHEF_ADDRESS, MASTERCHEF_ABI, provider);

// provider.getBlockNumber().then( (result: any) => {
//     console.log("Current block number: " + result);
// })

// masterchefInterface.poolLength().then( (result: any) => {
//     console.log("Number of pools: " + result);
// })

// masterchefInterface.poolInfo(0).then( (result: any) => {
//     console.log("First pool info: " + result);
// })

// masterchefInterface.burnAdmin().then( (result: string) => {
//     console.log('Admin: ' + result);
// })

// masterchefInterface.lpToken(0).then( (result: any) => {
//     console.log("First token info: " + result);
//     return result;
// }).then( (lpTokenAddress: any) => {
//     const lpTokenInterface = new ethers.Contract(lpTokenAddress, IBEP20_ABI, provider);
//     return lpTokenInterface.balanceOf(MASTERCHEF_ADDRESS);
// }).then( (result: any) => {
//     console.log("Balance of Masterchef for Token: " + result);
// })

const lpTokenIds = [5];

lpTokenIds.forEach( (tokenId) => {
    masterchefInterface.lpToken(tokenId).then( (result: any) => {
        console.log("First token address: " + result);
        return result;
    }).then( async (lpTokenAddress: any) => {
        const lpTokenInterface = new ethers.Contract(lpTokenAddress, IBEP20_ABI, provider);
        const name = await lpTokenInterface.name();
        console.log('Token Name: ' + name);
        return lpTokenInterface.balanceOf(MASTERCHEF_ADDRESS);
    }).then( (result: any) => {
        console.log("Balance of Masterchef for Token: " + result);
    })
})

