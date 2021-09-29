import Web3 from 'web3';
export const web3 = new Web3();

export const decodeParam = (type: string, param: string): any =>
  web3.eth.abi.decodeParameter(type, param);

export const encodeParam = (ptype: string, param: string): any =>
  web3.eth.abi.encodeParameter(ptype, param);
