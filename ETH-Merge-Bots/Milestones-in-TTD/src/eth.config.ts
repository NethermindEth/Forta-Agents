import BigNumber from "bignumber.js";

export const TERMINAL_TOTAL_DIFFICULTY: BigNumber = new BigNumber("58750000000000000000000");
// For testing the alert ETH-1-2, comment out the line above and uncomment the line below
// export const TERMINAL_TOTAL_DIFFICULTY: BigNumber = new BigNumber("56479908913672045394140");

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

// For testing the alert ETH-1-1, uncomment the lines below
// MILESTONES.LOW = 25;
// MILESTONES.MEDIUM = 20;
// MILESTONES.HIGH = 15;
// MILESTONES.CRITICAL = 5;
