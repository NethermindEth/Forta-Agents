import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';

import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from '@nethermindeth/general-agents-module';

export const RELY_FUNCTION_SIG = 'rely(address)';

const OSM_CONTRACTS = [
  '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763', // PIP_ETH
  '0xB4eb54AF9Cc7882DF0121d26c5b97E802915ABe6', // PIP_BAT
  '0x77b68899b99b686F415d074278a9a16b336085A0', // PIP_USDC
  '0xf185d0682d50819263941e5f4EacC763CC5C6C42', // PIP_WBTC
  '0xeE13831ca96d191B688A670D47173694ba98f1e5', // PIP_TUSD
  '0x7382c066801E7Acb2299aC8562847B9883f5CD3c', // PIP_ZRX
  '0xf36B79BD4C0904A5F350F1e4f776B81208c13069', // PIP_KNC
  '0x8067259EA630601f319FccE477977E55C6078C13', // PIP_MANA
  '0x7a5918670B0C390aD25f7beE908c1ACc2d314A3C', // PIP_USDT
  '0x043B963E1B2214eC90046167Ea29C2c8bDD7c0eC', // PIP_PAXUSD
  '0x043B963E1B2214eC90046167Ea29C2c8bDD7c0eC', // PIP_PAX
  '0xBED0879953E633135a48a157718Aa791AC0108E4', // PIP_COMP
  '0x9eb923339c24c40Bef2f4AF4961742AA7C23EF3a', // PIP_LRC
  '0x9B0C694C6939b5EA9584e9b61C7815E8d97D9cC7', // PIP_LINK
  '0x3ff860c0F28D69F392543A16A397D0dAe85D16dE', // PIP_BAL
  '0x5F122465bCf86F45922036970Be6DD7F58820214', // PIP_YFI
  '0xf45Ae69CcA1b9B043dAE2C83A5B65Bc605BEc5F5', // PIP_GUSD
  '0xf363c7e351C96b910b92b45d34190650df4aE8e7', // PIP_UNI
  '0xf185d0682d50819263941e5f4EacC763CC5C6C42', // PIP_RENBTC
  '0x8Df8f06DC2dE0434db40dcBb32a82A104218754c', // PIP_AAVE
  '0x8874964279302e6d4e523Fb1789981C39a1034Ba', // PIP_MATIC
  '0xFc8137E1a45BAF0030563EC4F0F851bd36a85b7D', // PIP_UNIV2DAIETH
  '0x8400D2EDb8B97f780356Ef602b1BdBc082c2aD07', // PIP_UNIV2WBTCETH
  '0xf751f24DD9cfAd885984D1bA68860F558D21E52A', // PIP_UNIV2USDCETH
  '0x25D03C2C928ADE19ff9f4FFECc07d991d0df054B', // PIP_UNIV2DAIUSDC
  '0x5f6dD5B421B8d92c59dC6D907C9271b1DBFE3016', // PIP_UNIV2ETHUSDT
  '0xd7d31e62AE5bfC3bfaa24Eda33e8c32D31a1746F', // PIP_UNIV2LINKETH
  '0x8462A88f50122782Cc96108F476deDB12248f931', // PIP_UNIV2UNIETH
  '0x5bB72127a196392cf4aC00Cf57aB278394d24e55', // PIP_UNIV2WBTCDAI
  '0x32d8416e8538Ac36272c44b0cd962cD7E0198489', // PIP_UNIV2AAVEETH
  '0x9A1CD705dc7ac64B50777BcEcA3529E58B1292F1', // PIP_UNIV2DAIUSDT
  '0x76A9f30B45F4ebFD60Ce8a1c6e963b1605f7cB6d', // PIP_RWA001
  '0xd2473237E20Bd52F8E7cE0FD79403A6a82fbAEC8', // PIP_RWA002
  '0xDeF7E88447F7D129420FC881B2a854ABB52B73B8', // PIP_RWA003
  '0x5eEE1F3d14850332A75324514CcbD2DBC8Bbc566', // PIP_RWA004
  '0x8E6039C558738eb136833aB50271ae065c700d2B', // PIP_RWA005
  '0xB8AeCF04Fdf22Ef6C0c6b6536896e1F2870C41D3', // PIP_RWA006
];

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) =>
    Finding.fromObject({
      name: 'Maker OSM Contract RELY Function Agent',
      description: 'RELY Function is called',
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata: {
        contract: metadata ? metadata.to : null,
      },
    });
};

export default function provideRelyFunctionAgent(
  alertID: string,
  contracts: string[] = OSM_CONTRACTS
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    contracts.map(async (_contract: string) => {
      const agentHandler = provideFunctionCallsDetectorAgent(
        createFindingGenerator(alertID),
        RELY_FUNCTION_SIG,
        { to: _contract }
      );

      const newFindings = await agentHandler(txEvent);
      findings.push(...newFindings);
    });

    return findings;
  };
}
