import { BigNumber } from "ethers";

export interface AddressManager {
  isKnownAddress(addr: string): boolean;
  update(addr: string | number): Promise<void>;
}

export type AddressVerifier = (addr: string) => boolean;

export enum HatFinding {
  UnknownHat = 0,
  HatModified = 1,
  FewApprovals = 2,
}

export enum LiftFinding {
  Lifter = 0,
  Spell = 1,
}

export const generateAddressVerifier = (addresses: string[]): AddressVerifier => {
  const set: Set<string> = new Set<string>(addresses.map((addr) => addr.toLowerCase()));
  return (addr: string): boolean => set.has(addr.toLowerCase());
};

export const toBalance = (num: BigNumber) => num.mul("1000000000000000000");
