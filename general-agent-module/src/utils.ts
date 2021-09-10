import { Finding } from "forta-agent";

type metadataVault = { [key: string]: any };

export type FindingGenerator = (metadata?: metadataVault) => Finding;
