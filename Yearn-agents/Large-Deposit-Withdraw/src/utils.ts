import { AbiItem } from "web3-utils"; 
import { 
  encodeFunctionCall, 
  encodeParameters, 
} from "forta-agent-tools";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import BigNumber from "bignumber.js";


const depositABI: AbiItem = {
  name: "deposit",
  type: "function",
  inputs: [{
    name: "amount",
    type: "uint256",
  },{
    name: "recipient",
    type: "address",
  }],
  outputs: [{
    name: "shares",
    type: "uint256",
  }]
};

const wrongABI: AbiItem = {
  name: "depoosit",
  type: "function",
  inputs: [{
    name: "amount",
    type: "uint256",
  },{
    name: "recipient",
    type: "address",
  }],
  outputs: [{
    name: "shares",
    type: "uint256",
  }]
};

export const createDepositFinding = (vault: string, from: string, to: string, value: string) => 
  Finding.fromObject({
    name: "Yearn Vaults deposit",
    description: "Large deposit detected",
    alertId: "Yearn-6-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      Vault: vault,
      From: from,
      To: to,
      Amount: value,
    },
  });

export const createWithdrawFinding = (vault: string, from: string, value: BigNumber) => 
  Finding.fromObject({
    name: "Yearn Vaults withdrawal",
    description: "Large withdrawal detected",
    alertId: "Yearn-6-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      Vault: vault,
      From: from,
      Amount: value.toString(),
    }
  });

export const traceData = (
  to: string, 
  from: string, 
  amount: string, 
  addr: string, 
  signature: AbiItem=depositABI
) => {
  return {
    to: to,
    from: from,
    input: encodeFunctionCall(signature, [amount, addr]),
    output: encodeParameters(signature.outputs as any, [amount]),
  }
};

export const traceBadData = (
  to: string, 
  from: string, 
  amount: string, 
  addr: string, 
) => traceData(to, from, amount, addr, wrongABI);
  