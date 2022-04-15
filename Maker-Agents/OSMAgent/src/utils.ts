import { Interface } from "ethers/lib/utils";

export const FUNCTIONS_ABIS = 
[
    "function list() public view returns (bytes32[] memory)", 
    "function get(uint256 _index) public view returns (bytes32, address)",
    "function getAddress(bytes32 _key) public view returns (address addr)",
    "function count() public view returns (uint256)"
];
export const EVENTS_ABIS = 
[
    "event UpdateAddress(bytes32 key, address addr)", 
    "event RemoveAddress(bytes32 key)"
];

export const CHAIN_LOG = "0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F";

export const RELY_FUNCTION_SIG = "function rely(address)";

export const DENY_FUNCTION_SIG = "function deny(address)";

export const MEGAPOKER_CONTRACT = "0x1cfd93a4864bec32c12c77594c2ec79deec16038";
export const POKE_FUNCTION_SIG = "function poke()";

export const PEEK_FUNCTION_SELECTOR = "0x59e02dd7";
export const LOG_VALUE_EVENT_SIGNATURE = "event LogValue(bytes32)";
export const PEEK_ABI = new Interface(["function peek() public view returns (bytes32, bool)"]);