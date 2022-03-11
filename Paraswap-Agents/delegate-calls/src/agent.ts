import {
  Finding,
  FindingType,
  FindingSeverity,
  TransactionEvent,
  HandleTransaction,
  getEthersProvider,
} from "forta-agent";

import { ethers } from "ethers";

import LRU from "lru-cache";

const cache: LRU<string, boolean> = new LRU<string, boolean>({ max: 10000 });

const AUGUSTUS_ADDR = "0xdef171fe48cf0115b1d80b88dc8eab59176fee57";
const TRANSFER_ADDR = "0x216B4B4Ba9F3e719726886d34a177484278Bfcae";

// bytes32 representation of ROUTER_ROLE (`0x524f555445525f524f4c45` == "ROUTER_ROLE")
const ROUTER_ROLE = ethers.utils.keccak256("0x524f555445525f524f4c45");

const PARA_ABI = [
  "function hasRole(bytes32 role, address account) public view returns (bool)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
];

// Checks if `logicAddr` has the role `ROUTER_ROLE` in the contract `paraAddr`
const checkRouterRole = async (paraAddr: string, logicAddr: string) => {
  let isRouterRole;
  // If the contract exists in the cache then return data
  if (cache.has(logicAddr)) {
    isRouterRole = cache.get(logicAddr);
    // Otherwise the cache does not contain data for `logicAddr`
  } else {
    try {
      // Check on-chain data to see if `logicAddr` has the correct role
      const provider = getEthersProvider();
      const contractInterface = new ethers.Contract(paraAddr, PARA_ABI, provider);
      isRouterRole = await contractInterface.hasRole(ROUTER_ROLE, logicAddr);
      cache.set(logicAddr, isRouterRole);
    } catch (error) {
      // Assume worst case (no router role)
      // Do not save to cache incase the try failing is due to a short term issue
      isRouterRole = false;
    }
  }
  return isRouterRole;
};

export const provideHandleTransaction = (addresses: string[]): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Setup the findings array
    const findings: Finding[] = [];

    // For each address in `addresses`
    await Promise.all(
      addresses.map(async (address) => {
        // Check if any contracts have had roles revoked and update `cache` if needed
        const roleRevokes = tx.filterLog(PARA_ABI[1], address);
        roleRevokes.forEach((roleRevoke) => {
          // If ROUTER_ROLE was removed from an account in the cache then update the cache
          if (roleRevoke.args.role == ROUTER_ROLE && cache.has(roleRevoke.args.account)) {
            cache.set(roleRevoke.args.account, false);
          }
        });

        // Look through traces to find all delegatecalls from `address`
        await Promise.all(
          tx.traces.map(async (trace) => {
            // If the calltype is "delegatecall" and the from address is `address`
            if (trace.action.callType == "delegatecall" && trace.action.from == address) {
              // Check if the logic contract for the delegatecall has ROUTER_ROLE
              const hasRouterRole = await checkRouterRole(address, trace.action.to);
              // Prepare variables to be used when generating a finding
              let desc;
              let alertId;
              let findingSeverity;
              let findingType;
              // Findings will be different depending on whether the logic address has role ROUTER_ROLE
              if (hasRouterRole == true) {
                desc = "A delegated call has been made to a trusted exchange contract";
                alertId = "PARASWAP-3-1";
                findingSeverity = FindingSeverity.Info;
                findingType = FindingType.Info;
              } else {
                desc = "A delegated call has been made to an unknown contract";
                alertId = "PARASWAP-3-2";
                findingSeverity = FindingSeverity.High;
                findingType = FindingType.Exploit;
              }
              // Create a finding
              findings.push(
                Finding.fromObject({
                  name: "Delegated Function Call Detected",
                  description: desc,
                  alertId: alertId,
                  severity: findingSeverity,
                  type: findingType,
                  protocol: "Paraswap",
                  metadata: {
                    logicContract: trace.action.to,
                  },
                })
              );
            }
          })
        );
      })
    );

    // Return all findings
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction([AUGUSTUS_ADDR, TRANSFER_ADDR]),
};
