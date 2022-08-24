import { Network } from "forta-agent";
import { createAddress } from "forta-agent-tools";
const EMPTY_ADDRESS = createAddress("0x00");
const HUBPOOL_ADDRESS = "0xc186fa914353c44b2e33ebe05f21846f1048beda";
const MAINNET_SPOKEPOOL = "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381";
const OPTIMISM_SPOKEPOOL = "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9";
const POLYGON_SPOKEPOOL = "0x69B5c72837769eF1e7C164Abc6515DcFf217F920";
const BOBA_SPOKEPOOL = "0xBbc6009fEfFc27ce705322832Cb2068F8C1e0A58";
const ARBITRUM_SPOKEPOOL = "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C";
const BOBA_CHAIN_ID = 288;

export interface NetworkDataInterface {
  hubPoolAddr: string;
  spokePoolAddr: string;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: { hubPoolAddr: HUBPOOL_ADDRESS, spokePoolAddr: MAINNET_SPOKEPOOL },
  [Network.OPTIMISM]: { hubPoolAddr: EMPTY_ADDRESS, spokePoolAddr: OPTIMISM_SPOKEPOOL },
  [Network.ARBITRUM]: { hubPoolAddr: EMPTY_ADDRESS, spokePoolAddr: ARBITRUM_SPOKEPOOL },
  [Network.POLYGON]: { hubPoolAddr: EMPTY_ADDRESS, spokePoolAddr: POLYGON_SPOKEPOOL },
  [BOBA_CHAIN_ID]: { hubPoolAddr: EMPTY_ADDRESS, spokePoolAddr: BOBA_SPOKEPOOL },
  // [Network.GOERLI]: { hubPoolAddr: "0xBc079C669989C432aBd026956f31CF82C8400faa" }, //PoC
};
