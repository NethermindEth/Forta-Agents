import { 
  Finding, 
  FindingSeverity, 
  FindingType, 
  LogDescription,
} from "forta-agent";

type FndingGenerator = (log: LogDescription) => Finding;

const addNft: FndingGenerator = (log: LogDescription): Finding => 
  Finding.fromObject({
    name: "NAFTA Operations",
    description: "AddNFT event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "NAFTA-OP-1",
    metadata: {
      nft: log.args["nftAddress"],
      id: `${log.args["nftId"]}`,
      sender: log.args["msgSender"],
      flashFee: `${log.args["flashFee"]}`,
      longtermFee: `${log.args["pricePerBlock"]}`,
      maxBlocks: `${log.args["maxLongtermBlocks"]}`,
      lenderNFT: `${log.args["lenderNFTId"]}`,
    }
  });

const editNFT: FndingGenerator = (log: LogDescription): Finding =>     
  Finding.fromObject({
    name: "NAFTA Operations",
    description: "EditNFT event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "NAFTA-OP-2",
    metadata: {
      nft: log.args["nftAddress"],
      id: `${log.args["nftId"]}`,
      sender: log.args["msgSender"],
      flashFee: `${log.args["flashFee"]}`,
      longtermFee: `${log.args["pricePerBlock"]}`,
      maxBlocks: `${log.args["maxLongtermBlocks"]}`,
      lenderNFT: `${log.args["lenderNFTId"]}`,
    }
  });

const removeNft: FndingGenerator = (log: LogDescription): Finding =>     
  Finding.fromObject({
    name: "NAFTA Operations",
    description: "RemoveNFT event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "NAFTA-OP-3",
    metadata: {
      nft: log.args["nftAddress"],
      id: `${log.args["nftId"]}`,
      sender: log.args["msgSender"],
      lenderNFT: `${log.args["lenderNFTId"]}`,
    }
  });

const functions: Record<string, FndingGenerator> = {
  "AddNFT": addNft,
  "EditNFT": editNFT,
  "RemoveNFT": removeNft,
}

const resolver: FndingGenerator = (log: LogDescription) => functions[log.name](log);

export default {
  addNft,
  editNFT,
  removeNft,
  resolver,
};
