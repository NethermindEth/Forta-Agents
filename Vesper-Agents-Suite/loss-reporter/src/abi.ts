import { AbiItem } from "web3-utils";

export const earningReportedSignature =
  "EarningReported(address,uint256,uint256,uint256,uint256,uint256,uint256)";

export const REPORT_LOSS_ABI = {
  name: "reportLoss",
  type: "function",
  inputs: [
    {
      type: "address",
      name: "",
    },
    {
      type: "uint256",
      name: "",
    },
  ],
} as AbiItem;
