export const EVENTS = {
  NewRandomGenerator: "event NewRandomGenerator(address indexed randomGenerator)",
  NewOperatorAndTreasuryAndInjectorAddresses:
    "event NewOperatorAndTreasuryAndInjectorAddresses(address operator,address treasury,address injector)",
};

export const ABI = [
  "function setMinAndMaxTicketPriceInCake(uint256 _minPriceTicketInCake,uint256 _maxPriceTicketInCake)",
  "function setMaxNumberTicketsPerBuy(uint256 _maxNumberTicketsPerBuy)",
];

export const FUNCTION_NAMES = ["setMinAndMaxTicketPriceInCake", "setMaxNumberTicketsPerBuy"];

export const PANCAKE_SWAP_LOTTERY_ADDRESS = "0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c";
