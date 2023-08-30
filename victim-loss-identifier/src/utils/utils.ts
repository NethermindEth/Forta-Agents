import { fetchJwt } from "forta-agent";
import { DATABASE_URL } from "../constants";
import { apiKeys } from "../types";

// TODO: Confirm these are the correct block times
function getChainBlockTime(chainId: number): number {
  switch (chainId) {
    case 10: // Optimism
      return 2;
    case 56: // BNB Smart Chain
      return 3;
    case 137: // Polygon
      return 2;
    case 250: // Fantom
      return 2;
    case 42161: // Arbitrum
      return 1;
    case 43114: // Avalance
      return 2;
    default: // Ethereum
      return 12;
  }
}

export function getBlocksInTimePeriodForChainId(timePeriodInSecs: number, chainId: number): number {
  const chainBlockTime = getChainBlockTime(chainId);

  return timePeriodInSecs / chainBlockTime;
}

export async function fetchApiKeys(): Promise<apiKeys> {
  const token = await fetchJwt({});
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const response = await fetch(`${DATABASE_URL}`, { headers });

    if (response.ok) {
      const apiKey: apiKeys = await response.json();
      return apiKey;
    } else {
      return {
        generalApiKeys: {
          ZETTABLOCK: [""],
        },
        apiKeys: {
          victimLoss: {
            alchemyApiKey: "",
          },
        },
      };
    }
  } catch (e) {
    console.log("Error in fetching API key.");
    throw e;
  }
}
