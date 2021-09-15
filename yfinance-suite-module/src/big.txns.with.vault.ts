import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { FindingGenerator, provideERC20TransferAgent } from "general-agents-module";
import Web3 from "web3";

const getUnderlayingAsset = async (web3: Web3, yearnVaultAddress: string): Promise<string> => {
  const txData: string = web3.eth.abi.encodeFunctionSignature("token()");
  const returnValue: string = await web3.eth.call({ to: yearnVaultAddress, data: txData });
  return web3.eth.abi.decodeParameter("address", returnValue) as any;
};

const createFindingGenerator = (
  isFrom: boolean,
  alertId: string,
  yearnVaultAddress: string,
  valueThreshold: string,
): FindingGenerator => {
  const directionString = isFrom ? "from" : "into";
  return () =>
    Finding.fromObject({
      name: "Big transaction related with Yearn Vault",
      description: `An amount greater than ${valueThreshold} of underlaying was moved ${directionString} Yearn Vault`,
      alertId,
      severity: FindingSeverity.Info,
      type: FindingType.Suspicious,
      metadata: {
        YearnVault: yearnVaultAddress,
      },
    });
};

export default function provideBigTransactionsAgent(
  web3: Web3,
  alertId: string,
  yearnVaultAddress: string,
  valueThreshold: string,
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    const underlyingTokenAddress: string = await getUnderlayingAsset(web3, yearnVaultAddress);
    const erc20InDetector = provideERC20TransferAgent(
      createFindingGenerator(false, alertId, yearnVaultAddress, valueThreshold),
      underlyingTokenAddress,
      { to: yearnVaultAddress, amountThreshold: valueThreshold },
    );
    const erc20OutDetector = provideERC20TransferAgent(
      createFindingGenerator(true, alertId, yearnVaultAddress, valueThreshold),
      underlyingTokenAddress,
      { from: yearnVaultAddress, amountThreshold: valueThreshold },
    );

    findings = findings.concat(await erc20InDetector(txEvent));
    findings = findings.concat(await erc20OutDetector(txEvent));

    return findings;
  };
}
