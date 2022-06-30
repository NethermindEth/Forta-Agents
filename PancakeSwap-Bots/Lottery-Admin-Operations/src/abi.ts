export const EVENTS = {
  NewRandomGenerator: "event NewRandomGenerator(address indexed randomGenerator)",
  NewOperatorAndTreasuryAndInjectorAddresses:
    "event NewOperatorAndTreasuryAndInjectorAddresses(address operator,address treasury,address injector)",
};

export const ABI = [
  "function setMinAndMaxTicketPriceInCake(uint256 _minPriceTicketInCake,uint256 _maxPriceTicketInCake)",
  "function setMaxNumberTicketsPerBuy(uint256 _maxNumberTicketsPerBuy)",
];

export const ALERTS = {
  NewRandomGenerator: "CAKE-8-1",
  NewOperatorAndTreasuryAndInjectorAddresses: "CAKE-8-2",
  setMinAndMaxTicketPriceInCake: "CAKE-8-3",
  setMaxNumberTicketsPerBuy: "CAKE-8-4",
};
