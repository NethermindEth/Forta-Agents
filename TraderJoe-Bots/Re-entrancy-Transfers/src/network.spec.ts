import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

/*
Format:[
    [network, joeTroller, sJoeStaking, masterChefV2, moneyMaker],  
];
*/

const TEST_CASES: [number, string, string, string, string][] = [
  [11, createAddress("0xb1a"), createAddress("0xb1b"), createAddress("0xb1c"), createAddress("0xb1d")],
  [22, createAddress("0xb2a"), createAddress("0xb2b"), createAddress("0xb2c"), createAddress("0xb2d")],
  [33, createAddress("0xb3a"), createAddress("0xb3b"), createAddress("0xb3c"), createAddress("0xb3d")],
];

const generateNetworkMap = (testData: any[][]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.

  let networkMap: Record<number, NetworkData> = {};
  for (let i = 0; i < testData.length; i++) {
    networkMap[testData[i][0]] = {
      joeTroller: testData[i][1],
      sJoeStaking: testData[i][2],
      masterChefV2: testData[i][3],
      moneyMaker: testData[i][4],
    } as NetworkData;
  }
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct addresses for each network", async () => {
    const networkMap: Record<number, NetworkData> = generateNetworkMap(TEST_CASES);
    const networkMan = new NetworkManager(networkMap);

    for (let i = 0; i < TEST_CASES.length; i++) {
      networkMan.setNetwork(TEST_CASES[i][0]);

      expect(networkMan.joeTroller).toStrictEqual(TEST_CASES[i][1]);
      expect(networkMan.sJoeStaking).toStrictEqual(TEST_CASES[i][2]);
      expect(networkMan.masterChefV2).toStrictEqual(TEST_CASES[i][3]);
      expect(networkMan.moneyMaker).toStrictEqual(TEST_CASES[i][4]);
    }
    // test with a non supported network
    let errorMessage = "";
    try {
      networkMan.setNetwork(99);
    } catch (error) {
      errorMessage = String(error);
    }
    expect(errorMessage).toStrictEqual(`Error: You are running the bot in a non supported network`);
  });
});
