import { AddressManager } from "./utils";

export default class ListManager implements AddressManager {
  private contents: Set<string>;

  public constructor(addresses: string[]) {
    this.contents = new Set<string>(addresses);
  }

  public async update(block: string | number): Promise<void> {}    

  public isKnownAddress(addr: string): boolean {
    return this.contents.has(addr);
  }
};
