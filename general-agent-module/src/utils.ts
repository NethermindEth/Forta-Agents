import { Finding } from "forta-agent";
import Web3 from "web3";

type metadataVault = { [key: string]: any };

export type FindingGenerator = (metadata?: metadataVault) => Finding;

export const toWei = Web3.utils.toWei;
