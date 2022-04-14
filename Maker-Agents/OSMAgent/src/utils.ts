import Web3 from "web3";

export const extractReliedAddress = (txnData: string): string => {
  const txnDataWithoutSelector = txnData.slice(10);
  return new Web3().eth.abi.decodeParameter(
    "address",
    txnDataWithoutSelector
  ) as any;
};

export const extractDeniedAddress = (txnData: string): string => {
  const txnDataWithoutSelector = txnData.slice(10);
  return new Web3().eth.abi.decodeParameter(
    "address",
    txnDataWithoutSelector
  ) as any;
};
