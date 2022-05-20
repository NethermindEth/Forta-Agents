const ethers = require('ethers');

// load the UniswapV3Factory abi
const {
  abi: uniswapV3FactoryAbi,
} = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json');

// load the Perpetual Finance contract addresses and abi paths
const protocolData = require('./protocol-data.json');

// create an array with the base tokens for Perpetual Finance
const baseTokens = ['vUSD', 'vBTC', 'vETH'];

function getContractAddressesAbis(contractNames) {
  const contractAddressesAbis = [];

  // iterate over the contracts to get their addresses, abis, and create ethers interfaces
  contractNames.forEach((contractName) => {
    let address;
    let contractAbi;
    // get the contract address and abi
    if (contractName === 'UniswapV3Factory') {
      address = protocolData.externalContracts.UniswapV3Factory.toLowerCase();
      contractAbi = uniswapV3FactoryAbi;
    } else if (baseTokens.indexOf(contractName) !== -1) {
      if (contractName === 'vUSD') {
        address = protocolData.contracts.QuoteToken.address.toLowerCase();
      } else {
        address = protocolData.contracts[contractName].address.toLowerCase();
      }
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const { abi } = require('./abi/BaseToken.json');
      contractAbi = abi;
    } else {
      address = protocolData.contracts[contractName].address.toLowerCase();
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const { abi } = require(`./abi/${contractName}.json`);
      contractAbi = abi;
    }

    const iface = new ethers.utils.Interface(contractAbi);

    // add a key/value pair for the contract name and address
    contractAddressesAbis.push({
      name: contractName,
      address,
      contractAbi,
      iface,
    });
  });

  return contractAddressesAbis;
}

module.exports = {
  getContractAddressesAbis,
};
