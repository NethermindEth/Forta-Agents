import { fetchJwt } from "forta-bot";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const OWNER_DB = "https://research.forta.network/database/owner/";
const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");

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
      const jwt = await getToken();
      const response = await fetch(`${OWNER_DB}${key}`, {
        headers: jwt,
      });
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Error loading JSON from owner db. Response - status: ${response.status} | status text: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Error loading JSON from owner db: ${error}`);
    }
  }
};

export const getSecrets = async (): Promise<object> => {
  return await loadJson("secrets.json");
};