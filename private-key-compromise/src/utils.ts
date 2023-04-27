import { timePeriodDays } from "./bot.config";

const ONE_DAY = 24 * 60 * 60;
export const TIME_PERIOD = timePeriodDays * ONE_DAY;

export interface NetworkData {
  threshold: string;
}

export type AgentConfig = Record<number, NetworkData>;

export type Transfer = Record<string, string[]>;

export type AlertedAddress = {
  address: string;
  timestamp: number;
};

export const ERC20_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 value)";

export const BALANCEOF_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
];

export const updateRecord = async (from: string, to: string, transferObj: Transfer) => {
  /**
   * Logic is to persist data into transferObj as shown below
   *
   *  {
   *    attacker1: [victim1, victim2..]
   *    attacker2: [victim1, victim2, victim3..]
   *    ...
   *  }
   */

  // if the attacker is already in transferObj and the victim is not, push the new victim address
  if (transferObj[to] && !transferObj[to].includes(from)) {
    transferObj[to].push(from);
  }

  // if the attacker is not in db, append it
  else if (!transferObj[to]) {
    transferObj[to] = [from];
  }
};

export const deepMerge = (target: Transfer, source: Transfer) => {
  const isObject = (obj: Transfer) => obj && typeof obj === "object";

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      const merged = targetValue.concat(sourceValue);
      target[key] = merged.filter((item, pos) => merged.indexOf(item) === pos);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
};
