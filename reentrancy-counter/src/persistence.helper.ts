import * as dotenv from "dotenv";
dotenv.config();
import { fetchJwt } from "forta-agent";
import fetch from "node-fetch";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Counter } from "./agent.utils";

export class PersistenceHelper {
  databaseUrl: string;
  fetch: any;

  constructor(dbUrl: string) {
    this.databaseUrl = dbUrl;
  }

  async persist(value: number | Counter, key: string) {
    /*
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
    */
  }

  async load(key: string): Promise<number | Counter | undefined> {
    /*
    const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
    if (!hasLocalNode) {
      const token = await fetchJwt({});
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const response = await fetch(`${this.databaseUrl}${key}`, { headers });

        if (response.ok) {
          let data: number | Counter;
          data = (await response.json()) as number | Counter;
          console.log(`successfully fetched ${data} from database`);
          return data;
        } else {
          console.log(`${key} has no database entry`);
          // If this is the first bot instance that is deployed,
          // the database will not have data to return,
          // thus return either 0 or the default values of the counter to assign value to the variables
          // necessary
          return key.startsWith("nm-reentrancy-counter-total")
            ? 0
            : {
                Info: 0,
                Low: 0,
                Medium: 0,
                High: 0,
                Critical: 0,
              };
        }
      } catch (e) {
        console.log(`Error in fetching data. Error: ${e}`);
        throw e;
      }
    } else {
      // Checking if it exists locally
      if (existsSync(key)) {
        let data: number | Counter;
        data = JSON.parse(readFileSync(key).toString()) as number | Counter;
        return data;
      } else {
        console.log(`file ${key} does not exist`);
        // If this is the first bot instance that is deployed,
        // the database will not have data to return,
        // thus return either 0 or the default values of the counter to assign value to the variables
        // necessary
        return key.startsWith("nm-reentrancy-counter-total")
          ? 0
          : {
              Info: 0,
              Low: 0,
              Medium: 0,
              High: 0,
              Critical: 0,
            };
      }
    }
    */
   return 0
  }
}
