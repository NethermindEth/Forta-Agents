import { createAddress } from "forta-agent-tools/lib/tests.utils";
import { Finding, FindingType, FindingSeverity } from "forta-agent";

export const randomGenerator = createAddress("0x123");
export const operator = createAddress("0x0123");
export const treasury = createAddress("0x0456");
export const injector = createAddress("0x0789");

export const NEW_RANDOM_GENERATOR_FINDING = Finding.fromObject({
  name: "New Random Generator",
  description: "PancakeSwapLottery: Random Number Generator changed",
  alertId: "CAKE-8-1",
  protocol: "PancakeSwap",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    randomGenerator: randomGenerator,
  },
});

export const NEW_OPERATOR_TREASURY_INJECTOR_FINDING = Finding.fromObject({
  name: "New Operator And Treasury And Injector Addresses",
  description: "PancakeSwapLottery: New Operator And Treasury And Injector Addresses",
  alertId: "CAKE-8-2",
  protocol: "PancakeSwap",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    operator,
    treasury,
    injector,
  },
});

export const SET_MAX_NUMBER_TICKETS_PER_BUY_FINDING = Finding.fromObject({
  name: "Function Call",
  description: "PancakeSwapLottery: setMaxNumberTicketsPerBuy",
  alertId: "CAKE-8-3",
  protocol: "PancakeSwap",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    _maxNumberTicketsPerBuy: "10",
  },
});

export const SET_MIN_MAX_TICKET_PRICE_CAKE_FINDING = Finding.fromObject({
  name: "Function Call",
  description: "PancakeSwapLottery: setMinAndMaxTicketPriceInCake",
  alertId: "CAKE-8-3",
  protocol: "PancakeSwap",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    _minPriceTicketInCake: "100000",
    _maxPriceTicketInCake: "200000",
  },
});
