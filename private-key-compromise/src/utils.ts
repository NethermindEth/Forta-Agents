import { PersistenceHelper } from "./persistence.helper";

export interface NetworkData {
  threshold: string;
}

export type AgentConfig = Record<number, NetworkData>;

export const BALANCEOF_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
];

const DATABASE_URL = "https://research.forta.network/database/bot/";

const persistenceHelper = new PersistenceHelper(DATABASE_URL);

export const updateDB = async (
  from: string,
  to: string,
  chainId: string,
  pkCompValueKey: string
) => {
  /**
   * Logic is to persist data into db as shown below
   *
   *  {
   *    attacker1: [victim1, victim2..]
   *    attacker2: [victim1, victim2, victim3..]
   *    ...
   *  }
   */

  let transferObj: any = {};

  const records: any = await persistenceHelper.load(pkCompValueKey.concat("-", chainId));
  console.log("records", records);

  // if this is the first time and there's no record in db, create one
  if (!Object.keys(records).length) {
    transferObj[to] = [from];

    await persistenceHelper.persist(transferObj, pkCompValueKey.concat("-", chainId));
  } else {
    const records: any = await persistenceHelper.load(
      pkCompValueKey.concat("-", chainId)
    );

    // if the attacker is already in db and the victim is not, push the new victim address
    if (records[to] && !records[to].includes(from)) {
      records[to].push(from);
      transferObj[to] = records[to];

      await persistenceHelper.persist(transferObj, pkCompValueKey.concat("-", chainId));
    }

    // if the attacker is not in db, append it
    else if (!records[to]) {
      records[to] = [from];
      transferObj = records;

      await persistenceHelper.persist(transferObj, pkCompValueKey.concat("-", chainId));
    }
  }
};
