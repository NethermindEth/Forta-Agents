import { fetchJwt } from "forta-agent";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
const OWNER_DB = "https://research.forta.network/database/owner/";

export type apiKeys = {
  apiKeys: {
    nativeIcePhishing: {
      etherscanApiKeys: string[];
      optimisticEtherscanApiKeys: string[];
      bscscanApiKeys: string[];
      polygonscanApiKeys: string[];
      fantomscanApiKeys: string[];
      arbiscanApiKeys: string[];
      snowtraceApiKeys: string[];
    };
  };
  generalApiKeys: {
    ZETTABLOCK: string[];
  };
};

const getToken = async () => {
  const tk = await fetchJwt({});
  return { Authorization: `Bearer ${tk}` };
};

const loadJson = async (key: string): Promise<object> => {
  if (hasLocalNode) {
    const data = readFileSync("secrets.json", "utf8");
    return JSON.parse(data);
  } else {
    try {
      const response = await fetch(`${OWNER_DB}${key}`, {
        headers: await getToken(),
      });
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(
          `Error loading JSON from owner db: ${response.status}, ${response.statusText}`
        );
      }
    } catch (error) {
      throw new Error(`Error loading JSON from owner db: ${error}`);
    }
  }
};

export const getSecrets = async (): Promise<object> => {
  return (await loadJson("secrets.json")) as apiKeys;
};
