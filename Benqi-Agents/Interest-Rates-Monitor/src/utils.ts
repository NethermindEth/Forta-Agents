import { BigNumber } from "ethers";

//QiTokens names, addresses and thresholds
export const QI_TOKENS: [
  name: string,
  address: string,
  lowerBorrow: BigNumber,
  upperBorrow: BigNumber,
  lowerSupply: BigNumber,
  upperSupply: BigNumber
][] = [
  [
    "qiAVAX",
    "0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
  [
    "qiBTC",
    "0xe194c4c5aC32a3C9ffDb358d9Bfd523a0B6d1568",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
  [
    "qiETH",
    "0x334AD834Cd4481BB02d09615E7c11a00579A7909",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
  [
    "qiUSDT",
    "0xc9e5999b8e75C3fEB117F6f73E664b9f3C8ca65C",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
  [
    "qiLINK",
    "0x4e9f683A27a6BdAD3FC2764003759277e93696e6",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
  [
    "qiUSDC",
    "0xBEb5d47A3f720Ec0a390d04b4d41ED7d9688bC7F",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
  [
    "qiDAI",
    "0x835866d37AFB8CB8F8334dCCdaf66cf01832Ff5D",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
  [
    "qiQI",
    "0x35Bd6aedA81a7E5FC7A7832490e71F757b0cD9Ce",
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(2200000000), // upper supply rate threshold
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(2200000000), // upper borrow rate threshold
  ],
];

export const QI_TOKENS_ABI: string[] = [
  "function borrowRatePerTimestamp() external view returns (uint)",
  "function supplyRatePerTimestamp() external view returns (uint)",
];

