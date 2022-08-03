type AgentConfig = Record<number, NetworkData>;

const CONFIG: AgentConfig = {
  56: {
    masterChef: "0x73feaa1eE314F8c655E354234017bE2193C9E24E",
  },
};

export interface NetworkData {
  masterChef: string;
}
export default CONFIG;
