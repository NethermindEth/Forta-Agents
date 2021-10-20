import { getJsonRpcUrl } from 'forta-agent';
import Web3 from 'web3';
import provideMakerStrategyHandler from './maker.strategy.cases.agent';

const web3: Web3 = new Web3(getJsonRpcUrl());

module.exports = {
  handleTransaction: provideMakerStrategyHandler(web3),
};
