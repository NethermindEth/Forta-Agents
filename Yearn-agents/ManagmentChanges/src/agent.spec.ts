import { FindingType, FindingSeverity, Finding, HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { ethers } from "ethers";
import { multicallAbi, vaultAbi } from "./yearn.metadata";
import { createAddress } from "forta-agent-tools";
import { createTransactionEvent } from "./utils";

const someYearnVaults = [
  "0x528D50dC9a333f01544177a924893FA1F5b9F748",
  "0x595a68a8c9D5C230001848B69b1947ee2A607164",
  "0x1b905331F7dE2748F4D6a0678e1521E20347643F",
  "0x490bD0886F221A5F79713D3E84404355A9293C50",
  "0x59518884EeBFb03e90a18ADBAAAB770d4666471e",
  "0x6FAfCA7f49B4Fd9dC38117469cd31A1E5aec91F5",
  "0x718AbE90777F5B778B52D553a5aBaa148DD0dc5D",
  "0x8b9C0c24307344B6D7941ab654b2Aeee25347473",
  "0xd8C620991b8E626C099eAaB29B1E3eEa279763bb",
];

// Yearn Governance address
const yearnGovernor = "0xfeb4acf3df3cdea7399794d0869ef76a6efaff52";

// Multicall Contract from MakerDAO on mainnet
const multicallContractAddress = "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441";

const createUpdateManagementFinding = (vaultAddress: string, management: string) => {
  return Finding.fromObject({
    name: "Updated Management",
    description: "A Yearn Vault has updated its manager",
    alertId: "Yearn-9-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      vaultAddress: vaultAddress,
      setManagement: management,
    },
  });
};

const createUpdateManagementFeeFinding = (vaultAddress: string, fee: string) => {
  return Finding.fromObject({
    name: "Updated Management Fee",
    description: "A Yearn Vault has updated its management fee",
    alertId: "Yearn-9-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      vaultAddress: vaultAddress,
      setFee: fee,
    },
  });
};

const createUpdatePerformanceFeeFinding = (vaultAddress: string, fee: string) => {
  return Finding.fromObject({
    name: "Updated Performance Fee",
    description: "A Yearn Vault has updated its performance fee",
    alertId: "Yearn-9-3",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      vaultAddress: vaultAddress,
      setFee: fee,
    },
  });
};

const createFortaTxEvent = async (ethersProvider: ethers.providers.Provider, txHash: string) => {
  const tx = await ethersProvider.getTransactionReceipt(txHash);
  if (tx.blockHash === undefined) {
    return undefined;
  }
  const block = await ethersProvider.getBlockWithTransactions(tx.blockHash);

  return createTransactionEvent(tx as any, block as any, 1);
};

describe("Vault Managment Tests", () => {
  let handleTransaction: HandleTransaction;
  let provider: ethers.providers.JsonRpcProvider;
  let governorSigner: ethers.Signer;
  jest.setTimeout(1000000000);

  beforeAll(() => {
    provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    provider.send("hardhat_impersonateAccount", [yearnGovernor]);
    governorSigner = provider.getSigner(yearnGovernor);
  });

  it("should return empty findings if not interesting event happened", async () => {
    handleTransaction = provideHandleTransaction(provider);

    const signer = provider.getSigner(0);
    let tx = await signer.sendTransaction({ to: createAddress("0x3"), value: ethers.utils.parseEther("1") });
    const txEvent = await createFortaTxEvent(provider, tx.hash);
    expect(txEvent).not.toBeUndefined();

    const findings = await handleTransaction(txEvent as any);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if the management contract was changed", async () => {
    handleTransaction = provideHandleTransaction(provider);

    const yearnVault = new ethers.Contract(someYearnVaults[0], vaultAbi, governorSigner);
    let tx = await yearnVault.setManagement(createAddress("0x2"));
    const txEvent = await createFortaTxEvent(provider, tx.hash);

    expect(txEvent).not.toBeUndefined();

    const findings = await handleTransaction(txEvent as any);

    expect(findings).toStrictEqual([createUpdateManagementFinding(someYearnVaults[0], createAddress("0x2"))]);
  });

  it("should return a finding if the Management Fee is changed", async () => {
    handleTransaction = provideHandleTransaction(provider);

    const yearnVault = new ethers.Contract(someYearnVaults[1], vaultAbi, governorSigner);
    let tx = await yearnVault.setManagementFee("10000");
    const txEvent = await createFortaTxEvent(provider, tx.hash);

    expect(txEvent).not.toBeUndefined();

    const findings = await handleTransaction(txEvent as any);

    expect(findings).toStrictEqual([createUpdateManagementFeeFinding(someYearnVaults[1], "10000")]);
  });

  it("should return a finding if the Performance Fee is changed", async () => {
    handleTransaction = provideHandleTransaction(provider);

    const yearnVault = new ethers.Contract(someYearnVaults[2], vaultAbi, governorSigner);
    let tx = await yearnVault.setPerformanceFee("10");
    const txEvent = await createFortaTxEvent(provider, tx.hash);

    expect(txEvent).not.toBeUndefined();

    const findings = await handleTransaction(txEvent as any);

    expect(findings).toStrictEqual([createUpdatePerformanceFeeFinding(someYearnVaults[2], "10")]);
  });

  it("should return multiple findings multiple events are emited", async () => {
    handleTransaction = provideHandleTransaction(provider);

    const yearnVault = new ethers.Contract(someYearnVaults[3], vaultAbi, governorSigner);

    // Setting multicall contract as governance
    let tx = await yearnVault.setGovernance(multicallContractAddress);

    const vaultInterface = new ethers.utils.Interface(vaultAbi);
    const acceptGovernanceData = vaultInterface.encodeFunctionData("acceptGovernance", []);
    const setManagementData = vaultInterface.encodeFunctionData("setManagement", [createAddress("0x3")]);
    const setManagementFeeData = vaultInterface.encodeFunctionData("setManagementFee", ["2000"]);

    // Accept governance and call multiple management methods
    const multicallContract = new ethers.Contract(multicallContractAddress, multicallAbi, governorSigner);
    tx = await multicallContract.aggregate([
      [someYearnVaults[3], acceptGovernanceData],
      [someYearnVaults[3], setManagementData],
      [someYearnVaults[3], setManagementFeeData],
    ]);

    const txEvent = await createFortaTxEvent(provider, tx.hash);

    expect(txEvent).not.toBeUndefined();

    const findings = await handleTransaction(txEvent as any);

    expect(findings).toStrictEqual([
      createUpdateManagementFinding(someYearnVaults[3], createAddress("0x3")),
      createUpdateManagementFeeFinding(someYearnVaults[3], "2000"),
    ]);
  });
});
