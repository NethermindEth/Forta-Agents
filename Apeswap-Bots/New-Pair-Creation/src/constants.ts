type contractType = {
  CREATE_PAIR_FUNCTION: string;
  APEFACTORY_ADDRESS: string;
};

const APEFACTORY_ABI: contractType = {
  CREATE_PAIR_FUNCTION: "function createPair(address tokenA, address tokenB)",
  APEFACTORY_ADDRESS: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
};

export { APEFACTORY_ABI };
