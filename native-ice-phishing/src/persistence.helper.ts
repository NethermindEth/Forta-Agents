import * as dotenv from "dotenv";
dotenv.config();
import { fetchJwt } from "forta-agent";
import fetch from "node-fetch";
import { existsSync, readFileSync, writeFileSync } from "fs";

export class PersistenceHelper {
  databaseUrl;

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
  }

  async load(key: string) {
    const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
    if (!hasLocalNode) {
      const token = await fetchJwt({});
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const response = await fetch(`${this.databaseUrl}${key}`, { headers });

        if (response.ok) {
          const data = await response.json();
          if (key.includes("alerted")) {
            console.log("successfully fetched addresses from database");
          } else {
            console.log("successfully fetched transfers from database");
          }
          return data;
        } else {
          console.log(
            `${key} has no database entry`,
            response.status,
            response.statusText
          );
          // If this is the first bot instance that is deployed,
          // the database will not have data to return,
          // thus return zero to assign value to the variables
          // necessary
          if (key.includes("alerted")) {
            return [];
          }
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

        // If this is the first bot instance that is deployed,
        // the database will not have data to return,
        // thus return zero to assign value to the variables
        // necessary
        if (key.includes("alerted")) {
          return [];
        }
        return {};
      }
    }
  }
}
