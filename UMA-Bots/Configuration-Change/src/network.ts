import { Network } from "forta-agent";

const POC_HUBPOOL_ADDRESS = "0x68715254125884dE73391b6bBaf0776Cf634c24D";
const POC_SPOKEPOOL_ADDRESS = "0x4972B5D2B9ac17784428701de1113d5A42970521";
const MAINNET_HUBPOOL = "0xc186fa914353c44b2e33ebe05f21846f1048beda";
const MAINNET_SPOKEPOOL = "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381";
const OPTIMISM_SPOKEPOOL = "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9";
const POLYGON_SPOKEPOOL = "0x69B5c72837769eF1e7C164Abc6515DcFf217F920";
const BOBA_SPOKEPOOL = "0xBbc6009fEfFc27ce705322832Cb2068F8C1e0A58";
const ARBITRUM_SPOKEPOOL = "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C";
const BOBA_CHAIN_ID = 288;

/*
 * @dev The first element in the "addresses" array is always the SpokePool contract address.
 * @dev In case a HubPool is deployed on the chain, its address will be the second element in the "addresses" array
 */
export interface NetworkDataInterface {
  addresses: string[];
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: { addresses: [MAINNET_SPOKEPOOL, MAINNET_HUBPOOL] },
  [Network.OPTIMISM]: { addresses: [OPTIMISM_SPOKEPOOL] },
  [Network.ARBITRUM]: { addresses: [ARBITRUM_SPOKEPOOL] },
  [Network.POLYGON]: { addresses: [POLYGON_SPOKEPOOL] },
  [BOBA_CHAIN_ID]: { addresses: [BOBA_SPOKEPOOL] },
  [Network.GOERLI]: { addresses: [POC_SPOKEPOOL_ADDRESS, POC_HUBPOOL_ADDRESS] }, //PoC
};
