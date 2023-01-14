import { fetchJwt } from "forta-agent";
// import fetch from "node-fetch";
import { existsSync, readFileSync, writeFileSync } from "fs";
// require("dotenv").config();

export default class PersistenceHelper {
  databaseUrl: string;
  fetch: any;

  constructor(dbUrl: string, fetch: any) {
    this.databaseUrl = dbUrl;
    this.fetch = fetch;
    console.log(`inside PHelper constructor`);
  }

  // TODO: figure out exact type for value
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
        console.log(`failed to persist ${value} to database. Error: ${e}`);
      }
    } else {
      // Persist locally
      writeFileSync(key, value.toString());
      return;
    }
  }

  async load(key: string) {
    const hasLocalNode = process.env.hasOwnProperty("LOCAL_NODE");
    if (!hasLocalNode) {
      const token = await fetchJwt({});
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const response = await this.fetch(`${this.databaseUrl}${key}`, { headers });

        if (response.ok) {
          // TODO: Figure if `any` is right type for `data`
          const data: any = await response.json();
          console.log(`successfully fetched value from database`);
          return parseInt(data);
        } else {
          console.log(`${key} has no database entry`);
          // If this is the first bot instance that is deployed,
          // the database will not have data to return,
          // thus return zero to assign value to the variables
          // necessary
          return 0;
        }
      } catch (e) {
        console.log(`Error in fetching data.`);
        throw e;
      }
    } else {
      // Checking if it exists locally
      if (existsSync(key)) {
        const data = readFileSync(key);
        return parseInt(data.toString());
      } else {
        console.log(`file ${key} does not exist`);
        // If this is the first bot instance that is deployed,
        // the database will not have data to return,
        // thus return zero to assign value to the variables
        // necessary
        return 0;
      }
    }
  }
}
