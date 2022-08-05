import { Network } from "forta-agent";

type AgentConfig = Record<number, NetworkData>;

const CONFIG: AgentConfig = {
  [Network.BSC]: {
    masterChef: "0x73feaa1eE314F8c655E354234017bE2193C9E24E",
  },
  // Uncomment lines 10-12 for BNB smart chain testnet tests:
  // 97: {
  //   masterChef: "0xbD315DA028B586f7cD93903498e671fA3efeF506",
  // },
};

export interface NetworkData {
  masterChef: string;
}
export default CONFIG;
