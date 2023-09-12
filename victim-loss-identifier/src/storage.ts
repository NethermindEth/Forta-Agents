import { fetchJwt } from "forta-agent";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { OWNER_DB, BOT_DB } from "./constants";
import * as dotenv from "dotenv";
dotenv.config();

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
      const response = await fetch(`${OWNER_DB}${key}`, {
        headers: await getToken(),
      });
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Error loading JSON from owner db: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Error loading JSON from owner db: ${error}`);
    }
  }
};

export const persist = async (value: any, key: string) => {
  const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
  if (!hasLocalNode) {
    try {
      const response = await fetch(`${BOT_DB}${key}`, {
        method: "POST",
        headers: await getToken(),
        body: JSON.stringify(value),
      });

      if (response.ok) {
        console.log("successfully persisted object to database");
      } else {
        console.log(response.status, response.statusText);
      }
      return;
    } catch (e) {
      console.log(`failed to persist object to database. Error: ${e}`);
    }
  } else {
    // Persist locally
    writeFileSync(key, JSON.stringify(value));
    return;
  }
};

export const load = async (key: string) => {
  const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
  if (!hasLocalNode) {
    try {
      const response = await fetch(`${BOT_DB}${key}`, { headers: await getToken() });

      if (response.ok) {
        const data = await response.json();
        console.log("successfully fetched object from database");
        return data;
      } else {
        console.log(`${key} has no database entry`, response.status, response.statusText);
        return {};
      }
    } catch (e) {
      console.log(`Error in fetching data.`);
      throw e;
    }
  } else {
    // Checking if it exists locally
    if (existsSync(key)) {
      let data;
      data = JSON.parse(readFileSync(key).toString());
      return data;
    } else {
      console.log(`file ${key} does not exist`);
      return {};
    }
  }
};

export const getSecrets = async (): Promise<object> => {
  return await loadJson("secrets.json");
};
