import BigNumber from "bignumber.js";

export const TERMINAL_TOTAL_DIFFICULTY: BigNumber = new BigNumber("58750000000000000000000");

// Days left for the merge
export const MILESTONES = {
  LOW: 20,
  MEDIUM: 15,
  HIGH: 10,
  CRITICAL: 5,
};

export const ETH_BLOCK_DATA = {
  avgBlockTime: 13.46, // average block time between Aug 13th - Aug 19th
  blockNumberAWeek: 44236, // total number of blocks mined in between Aug 13th - Aug 19th
};

// For testing purposes, uncomment the line below and comment out the 3rd line
// export const TERMINAL_TOTAL_DIFFICULTY: BigNumber = new BigNumber("56479908913672045394140");
/*
The above variable is the total difficulty of block 15351000. In order to test the code with the real blocks
and with these `MILESTONES`, this block was chosen as if its total difficulty is `Terminal Total Difficulty`.
*/
