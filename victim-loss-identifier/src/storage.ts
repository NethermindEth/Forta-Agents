import { fetchJwt } from "forta-agent";
import { existsSync, readFileSync, writeFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
const ownerDB = "https://research.forta.network/database/owner/";
const botDB = "https://research.forta.network/database/bot/";

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
      const response = await fetch(`${ownerDB}${key}`, {
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
    const token = await fetchJwt({});

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await fetch(`${botDB}${key}`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(value),
      });

      if (response.ok) {
        if (key.includes("alerted")) {
          console.log("successfully persisted addresses to database");
        } else {
          console.log("successfully persisted transfers to database");
        }
        return;
      } else {
        console.log(response.status, response.statusText);
      }
    } catch (e) {
      console.log(`failed to persist value to database. Error: ${e}`);
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
    const token = await fetchJwt({});
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await fetch(`${botDB}${key}`, { headers });

      if (response.ok) {
        const data = await response.json();
        if (key.includes("alerted")) {
          console.log("successfully fetched addresses from database");
        } else {
          console.log("successfully fetched transfers from database");
        }
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
