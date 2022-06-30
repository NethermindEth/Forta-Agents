import { createAddress } from "forta-agent-tools/lib/tests.utils";

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

export const MOCK_CONTRACT_ADDRESS = createAddress("0x1a2c");
