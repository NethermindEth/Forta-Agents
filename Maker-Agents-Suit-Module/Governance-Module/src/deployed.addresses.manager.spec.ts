import AddressManager from "./deployed.addresses.manager";
import { createAddr } from "./utils";

const addr1: string = createAddr("0x1");
const addr2: string = createAddr("0x2");
const dead: string = createAddr("0xdead");
const deadContracts: string[] = [
  "0x2387b3383e89c164781d173b7aa14d9c46ed2642",
  "0x22bc2df58d96cbc5f2599f2c25d1e565974749ee",
  "0x7bbcfa8c109b0a6888d3329a6b762ad4782e0b26",
  "0x48c33395391c097df9c9aa887a40f1b47948d393",
  "0x13f8f173f6cbb87b606526853092f423537395ad",
  "0xf7d155cb4cf4ab327f15b14e207932b9fefb405a",
  "0x0e7ee05d6a4b12e549a05c4fdb926da2af057560",
  "0xc04c7477f209054ca74ed44e58a50443ec526d11",
  "0x2f9b83b70bd51a3bf6b23f44649a6d6d2cb3ac5c",
  "0x872c81f3569758132e5f2ded064a7f54e129086c",
];

describe("DeployedAddressManager test suite", () => {
  const getNonce: any = jest.fn();
  let addressesManager: AddressManager = new AddressManager(dead, getNonce);

  it("Should update the deployed addresses at each nonce increasement", async () => {
    // advance nonce to 1
    getNonce.mockReturnValueOnce(1);
    await addressesManager.update();

    expect(addressesManager.isDeployedAddress(deadContracts[0])).toStrictEqual(true);
    expect(addressesManager.isDeployedAddress(addr1)).toStrictEqual(false);
    expect(addressesManager.isDeployedAddress(deadContracts[1])).toStrictEqual(false);

    // same addreses as before
    getNonce.mockReturnValueOnce(1);
    await addressesManager.update();

    expect(addressesManager.isDeployedAddress(deadContracts[0])).toStrictEqual(true);
    expect(addressesManager.isDeployedAddress(addr1)).toStrictEqual(false);
    expect(addressesManager.isDeployedAddress(deadContracts[2])).toStrictEqual(false);

    // advance nonce to 3
    getNonce.mockReturnValueOnce(3);
    await addressesManager.update();

    expect(addressesManager.isDeployedAddress(deadContracts[0])).toStrictEqual(true);
    expect(addressesManager.isDeployedAddress(addr1)).toStrictEqual(false);
    expect(addressesManager.isDeployedAddress(deadContracts[1])).toStrictEqual(true);
    expect(addressesManager.isDeployedAddress(deadContracts[2])).toStrictEqual(true);
    expect(addressesManager.isDeployedAddress(deadContracts[3])).toStrictEqual(false);

    // advance nonce to 4
    getNonce.mockReturnValueOnce(4);
    // get the nonce related to a block
    await addressesManager.update(10);

    expect(addressesManager.isDeployedAddress(deadContracts[3])).toStrictEqual(true);

    // advance nonce to 10
    getNonce.mockReturnValueOnce(10);
    await addressesManager.update();

    for (let addr of deadContracts) expect(addressesManager.isDeployedAddress(addr)).toStrictEqual(true);
    expect(addressesManager.isDeployedAddress(addr2)).toStrictEqual(false);

    // check the getNonce parameters
    expect(getNonce).toBeCalledTimes(5);
    expect(getNonce).nthCalledWith(1, dead, "latest");
    expect(getNonce).nthCalledWith(2, dead, "latest");
    expect(getNonce).nthCalledWith(3, dead, "latest");
    expect(getNonce).nthCalledWith(4, dead, 10);
    expect(getNonce).nthCalledWith(5, dead, "latest");
  });
});
