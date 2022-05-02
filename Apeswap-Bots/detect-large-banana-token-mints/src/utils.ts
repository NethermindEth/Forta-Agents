import { Finding, FindingSeverity, FindingType, LogDescription, ethers } from "forta-agent";
import { GLOBALS } from "./constants";
const { BANANA_CONTRACT_ADDRESS_BNBCHAIN } = GLOBALS;

type mintFunctionDetails = {
  args: ethers.utils.Result;
  name: string;
};

type bananaFindingMetaData = {
  from: string;
  to?: string;
  value: string;
  network?: string;
};

type contractType = {
  address: string;
};

const contractMetaData: contractType = {
  address: BANANA_CONTRACT_ADDRESS_BNBCHAIN,
};

const createFinding = (mintInfo: bananaFindingMetaData): Finding => {
  let txNetwork: string = "";
  if (mintInfo.network === "56") {
    txNetwork = "BNB Chain";
  } else {
    txNetwork = "Polygon";
  }
  return Finding.fromObject({
    name: "detect banana mint",
    description: `${mintInfo.value} banana minted`,
    alertId: "APESWAP-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",

    metadata: {
      from: mintInfo.from,
      to: mintInfo.to || "",
      value: mintInfo.value || "",
      network: txNetwork,
    },
  });
};

export { createFinding, mintFunctionDetails, bananaFindingMetaData, contractType, contractMetaData };
