import * as dotenv from "dotenv";
dotenv.config();
import { fetchJwt } from "forta-agent";
import fetch from "node-fetch";
import { existsSync, readFileSync, writeFileSync } from "fs";

export class PersistenceHelper {
  databaseUrl: string;
  fetch: any;

  constructor(dbUrl: string) {
    this.databaseUrl = dbUrl;
  }

  async persist(value: any, key: string) {
    const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
    if (!hasLocalNode) {
      const token = await fetchJwt({});
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const response = await fetch(`${this.databaseUrl}${key}`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(value),
        });
        if (response.ok) {
          console.log(`successfully persisted ${value} to database`);
          return;
        }
      } catch (e) {
        console.log(`Failed to persist ${value} to database. Error: ${e}`);
      }
    } else {
      // Persist locally
      writeFileSync(key, JSON.stringify(value));
      return;
    }
  }

  async load(key: string) {
    const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
    if (!hasLocalNode) {
      const token = await fetchJwt({});
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const response = await fetch(`${this.databaseUrl}${key}`, { headers });

        if (response.ok) {
          const data: any = await response.json();
          const value = JSON.parse(data);
          console.log(`successfully fetched ${value} from database`);
          return value;
        } else {
          console.log(`${key} has no database entry`);
          // If this is the first bot instance that is deployed,
          // the database will not have data to return,
          // thus return zero to assign value to the variables
          // necessary
          return {};
        }
      } catch (e) {
        console.log(`Error in fetching data. Error: ${e}`);
        throw e;
      }
    } else {
      // Checking if it exists locally
      if (existsSync(key)) {
        const data = readFileSync(key);
        return JSON.parse(data.toString());
      } else {
        console.log(`file ${key} does not exist`);
        // If this is the first bot instance that is deployed,
        // the database will not have data to return,
        // thus return zero to assign value to the variables
        // necessary
        return {};
      }
    }
  }
}
