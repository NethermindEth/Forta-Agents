import { createAddress } from "forta-agent-tools";
import ListManager from "./address.list.manager";
import { AddressManager } from "./utils";

describe("ListManager tests suite", () => {
  it("should manage the addresses properly", () => {
    const addresses: string[] = [
      createAddress("0x1"),
      createAddress("0xcafe"),
      createAddress("0xdead"),
      createAddress("0xabc1"),
      createAddress("0xabc2"),
    ];
    const manager: AddressManager = new ListManager(addresses);
    for(let addr of addresses){
      expect(manager.isKnownAddress(addr)).toStrictEqual(true);
    }
    expect(manager.isKnownAddress(createAddress('0x10'))).toStrictEqual(false);
    expect(manager.isKnownAddress(createAddress('0xd34d'))).toStrictEqual(false);
    expect(manager.isKnownAddress(createAddress('0xc4f3'))).toStrictEqual(false);
  })
});
