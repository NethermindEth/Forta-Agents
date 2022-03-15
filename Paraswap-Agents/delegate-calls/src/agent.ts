import {
  Finding,
  TransactionEvent,
  HandleTransaction,
  getEthersProvider,
} from "forta-agent";

import { ethers } from "ethers";

import LRU from "lru-cache";

import { createFinding } from "./finding";

const cache: LRU<string, boolean> = new LRU<string, boolean>({ max: 10000 });

// The address of the Paraswap contract (the contract's name is "AugustusSwapper")
const AUGUSTUS_ADDR = "0xdef171fe48cf0115b1d80b88dc8eab59176fee57";

// bytes32 representation of the `ROUTER_ROLE` signature (`"ROUTER_ROLE` == "0x524f555445525f524f4c45`)
const ROUTER_ROLE = ethers.utils.keccak256("0x524f555445525f524f4c45");

export const PARA_ABI = [
  "function hasRole(bytes32 role, address account) public view returns (bool)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
];

// Checks if `logicAddr` has the role `ROUTER_ROLE` in the contract `paraAddr`
const checkRouterRole = async (
  paraAddr: string,
  logicAddr: string,
  block: number | string
): Promise<boolean | undefined> => {
  let isRouterRole;
  // If the contract exists in the cache then return data
  if (cache.has(logicAddr)) {
    isRouterRole = cache.get(logicAddr);
  // Otherwise the cache does not contain data for `logicAddr`
  } else {
    try {
      // Check on-chain data to see if `logicAddr` has the correct role
      const paraContractIface = new ethers.Contract(paraAddr, PARA_ABI, getEthersProvider());
      isRouterRole = await paraContractIface.hasRole(ROUTER_ROLE, logicAddr, { blocktag: block });
      cache.set(logicAddr, isRouterRole);
    } catch (error) {
      // If there is as error set `isRouterRole` to undefined
      // A special finding to indicate that the on-chain call failed is generated when `isRouterRole` is undefined
      // This is not saved to cache in case it was a short term issue
      isRouterRole = undefined;
    }
  }
  return isRouterRole;
};

export const provideHandleTransaction = (paraAddr: string, checkRouterRole: any): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Setup the findings array
    const findings: Finding[] = [];

    // Check if any contracts have had roles granted and update `cache` if needed
    const roleGrants = tx.filterLog(PARA_ABI[1], paraAddr);
    roleGrants.forEach((roleGrant) => {
      // If ROUTER_ROLE was granted to an account that is inside the cache then update the cache
      if (roleGrant.args.role == ROUTER_ROLE && cache.has(roleGrant.args.account)) {
        cache.set(roleGrant.args.account, true);
      }
    });

    // Check if any contracts have had roles revoked and update `cache` if needed
    const roleRevokes = tx.filterLog(PARA_ABI[2], paraAddr);
    roleRevokes.forEach((roleRevoke) => {
      // If ROUTER_ROLE was removed from an account that is inside the cache then update the cache
      if (roleRevoke.args.role == ROUTER_ROLE && cache.has(roleRevoke.args.account)) {
        cache.set(roleRevoke.args.account, false);
      }
    });

    // For each trace in the transaction
    await Promise.all(
      tx.traces.map(async (trace) => {
        // If the calltype is "delegatecall" and the from address is `address`
        if (trace.action.callType == "delegatecall" && trace.action.from == paraAddr) {
          // Check if the logic contract for the delegatecall has the role ` ROUTER_ROLE`
          const hasRouterRole = await checkRouterRole(paraAddr, trace.action.to, tx.blockNumber);
          // Create a finding
          findings.push(createFinding(hasRouterRole, trace.action.to));
        }
      })
    );

    // Return all findings
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(AUGUSTUS_ADDR, checkRouterRole),
};
