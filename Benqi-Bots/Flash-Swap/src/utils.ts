import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const PGL_CONTRACT: string = "0xE530dC2095Ef5653205CF5ea79F8979a7028065c";
export const TESTNET_CONTRACT: string = "0x88C80C9d00D9583b252f8151D8489b5A35506e55";
export const SWAP_ABI: string = "function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)";

export const createFinding = (amount0Out: string, amount1Out: string, to: string) => {
  return Finding.fromObject({
    name: "Flash Swap Alert",
    description: "Flash swap detected on PGL contract.",
    alertId: "BENQI-9",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi Finance",
    metadata: {
      amount0Out,
      amount1Out,
      to,
    },
  });
};
