import { EntityType, Finding, FindingSeverity, FindingType, Label, ethers } from "forta-agent";

export const createFinding = (
  addresses: { address: string; confidence: number; anomalyScore: number; isProfitInUsd: boolean; profit: number }[],
  txHash: string,
  severity: FindingSeverity,
  txFrom: string,
  txTo: string
): Finding => {
  let labels: Label[] = [];
  let metadata: {
    [key: string]: string;
  } = {};
  metadata["txFrom"] = txFrom;
  metadata["txTo"] = txTo;

  const anomalyScore = addresses.reduce(
    (min, { anomalyScore }) => Math.min(min, anomalyScore),
    addresses[0].anomalyScore
  );
  metadata["anomalyScore"] = anomalyScore.toString();

  let index = 1;
  let profit = "";
  addresses.map((address) => {
    profit = address.isProfitInUsd ? `$${address.profit.toFixed(2)}` : `${address.profit}% of total supply`;
    metadata[`profit${index}`] = profit;
    index++;
    labels.push(
      Label.fromObject({
        entity: address.address,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: address.confidence,
        remove: false,
      })
    );
  });
  if (!labels.some((label) => label.entity.toLowerCase() === txFrom)) {
    // Get the max confidence of the existing labels and set it as the confidence of the txFrom label
    const maxConfidence = labels.reduce((max, label) => {
      return label.confidence > max ? label.confidence : max;
    }, 0);
    labels.push(
      Label.fromObject({
        entity: ethers.utils.getAddress(txFrom),
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: maxConfidence,
        remove: false,
      })
    );
  }
  labels.push(
    Label.fromObject({
      entity: txHash,
      entityType: EntityType.Transaction,
      label: "Attack",
      confidence: 1,
      remove: false,
    })
  );

  return Finding.fromObject({
    name: "Large Profit",
    description: "Transaction resulted in a large profit for the initiator",
    alertId: "LARGE-PROFIT",
    severity,
    type: FindingType.Suspicious,
    metadata,
    labels,
  });
};

export const MAX_USD_VALUE = 500000;

export const wrappedNativeTokens: Record<number, string> = {
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  10: "0x4200000000000000000000000000000000000006",
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  137: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
};

export const UNISWAP_ROUTER_ADDRESSES = [
  "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b", // Uniswap Universal Router
  "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3: Router
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap V3: Router 2
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2: Router 2
];

export const nftCollateralizedLendingProtocols: Record<number, string[]> = {
  1: [
    "0x52ab06b7a6eefaf50587cdb7d896a999970067be", // Cyan Payment Plan 1.0
    "0x844dc364d252a2bada2ec4932f25a86871da725c", // Cyan Payment Plan 2.0
    "0xe803684b9e391d01dc1cdf76bac9ae3a596b2ae0", // Cyan Payment Plan V2
    "0x2a59d61d2e8d58ce5ad76b2a2539c38efe737cb7", // Liqd Lending
    "0xd77b1231dc5a7eb8bc8232439caf0789d364299b", // Liqd Lending
    "0x0fd53429d9cdf19a8b2b9e4fc8f53f65dd992f91", // Liqd Lending
    "0xe3e0e805cbc94d59547c36a9eb6d09c7d5425f94", // Liqd Lending
    "0x29469395eaf6f95920e59f858042f0e28d98a20b", // Blur: Blend
    "0x70b97a0da65c15dfb0ffa02aee6fa36e507c2762", // BendDAO: LendPool
    "0xd636a2fc1c18a54db4442c3249d5e620cf8fe98f", // JPEG'd Cryptopunks PUSd Vault
    "0x4e5f305bfca77b17f804635a9ba669e187d51719", // JPEG'd Cryptopunks PETH Vault
    "0xd120cf3e0408dd794f856e8ca2a23e3396a9b687", // JPEG'd Etherrocks PUSd Vault
    "0x7bc8c4d106f084304d6c224f48ac02e6854c7ac5", // JPEG'd Etherrocks PETH Vault
    "0x271c7603aaf2bd8f68e8ca60f4a4f22c4920259f", // JPEG'd Bored Ape Yacht Club PUSd Vault
    "0xaf5e4c1bfac63e355cf093eea3d4aba138ea4089", // JPEG'd Bored Ape Yacht Club PETH Vault
    "0x7b179f9bfbe50cfa401c1cdde3cb2c339c6635f3", // JPEG'd Mutant Ape Yacht Club PUSd Vault
    "0xc45775baa4a6040414f3e199767033257a2a91b9", // JPEG'd Mutant Ape Yacht Club PETH Vault
    "0x3a90db2e3392a26904da1aa632b4c26a824d296e", // JPEG'd Bored Kennel Yacht Club PUSd Vault
    "0xbf3624e8e72737d632c27eaf814668200f3b0e09", // JPEG'd Bored Kennel Yacht Club PETH Vault
    "0x09765190845c35fb81efd6952e19c995f6bd6a72", // JPEG'd Otherdeeds PUSd Vault
    "0x525a3999b65a7d06dbe1de9b0b5faab1dc72e83c", // JPEG'd Otherdeeds PETH Vault
    "0xf7fa42b692b8132311b02f9d72af69f9587c447e", // JPEG'd Meebits PUSd Vault
    "0xd5a4ff073fb6ba54b52cec0747a69a2ebed08d3f", // JPEG'd Meebits PETH Vault
    "0x0a36f4bf39ed7d4718bd1b8dd759c19986ccd1a7", // JPEG'd Doodles PUSd Vault
    "0x229e09d943a94c162a662ba0ffbcad21521b477a", // JPEG'd Doodles PETH Vault
    "0x2acd96c8db23978a3dd32448a2477b132b4436e4", // JPEG'd Azuki PUSd Vault
    "0x72695c2af4193029e0669f2c01d84b619d8c25e7", // JPEG'd Azuki PETH Vault
    "0xe793eaedc048b7441ed61b51acb5df107af996c2", // JPEG'd Pudgy Penguins PUSd Vault
    "0x4b94b38bec611a2c93188949f017806c22097e9f", // JPEG'd Pudgy Penguins PETH Vault
    "0xc001f165f7d7542d22a1e82b4640512034a91c7d", // JPEG'd CloneX PUSd Vault
    "0x46db8fda0be00e8912bc28357d1e28e39bb404e2", // JPEG'd CloneX PETH Vault
    "0xf42366f60ccc0f454b505fd72fb070e7f23b8171", // JPEG'd Autoglyphs PUSd Vault
    "0xcfd74e932b49eef26f6527091821ada8a9a4cbda", // JPEG'd Autoglyphs PETH Vault
    "0x266d98307469f86f134ab884afefa98d3b4835b1", // JPEG'd Chromie Squiggle PUSd Vault
    "0x2a8d4e3bb2e09541bf5d79a1cf8b9dd2b3a1c6ab", // JPEG'd Chromie Squiggle PETH Vault
    "0x64979ea0e4c7eb440402fef273483ec8e74146d0", // JPEG'd Fidenzas PUSd Vault
    "0x9c1dced6c1668c4159cf71c41f54f0fb9c2dc9dc", // JPEG'd Fidenzas PETH Vault
    "0xa699e2f651861ec68e74fe01017ade75a12d5c1b", // JPEG'd Ringers PUSd Vault
    "0xdc6634879cef6ed24ef0273daa4a12b34e3d09cc", // JPEG'd Milady PUSd Vault
    "0xdda32416e87c475a0bcbc6c2e74190e7c49c1e5f", // JPEG'd Milady PETH Vault
    "0x774badbc759234bff52b0be11bf61bb68c9e9a24", // Pine Router
    "0x197bb6cd6cc9e9abbfdabff23de7435c51d1b7be", // Astaria
    "0x9c27e6ecabb992f266a64c2d1a76ed5031e381eb", // Zharta Loans Peripheral (Zharta Loans Core Address setting the Peripheral: 0x5Be916Cff5f07870e9Aef205960e07d9e287eF27)
    "0x4c52ca29388a8a854095fd2beb83191d68dc840b", // Arcade.xyz: Origination Controller Proxy
    "0x4ae7413182849d062b72518928a4b2de87f0e411", // Drops: D0-ETH
    "0x3fed9c8b527fa6299b3044e5178acc34ec2e25e2", // Drops: D0-USDC
    "0xdb6994189db5f14a9261cf0420cc377badab03be", // Drops: D0-WBTC
    "0x28af5f61544916d33c4105eb536c9177f5523b67", // Drops: D0-ENJ
    "0x54c312ba0b974d56e2c532ca407ffda2c6a14793", // Drops: D0-MATIC
    "0xd72929e284e8bc2f7458a6302be961b91bccb339", // Drops: D1-ETH
    "0x7489c6baaba57d9a431642b26e034acd191039f7", // Drops: D1-USDC
    "0x0a1ef7fed1b691253f9367daf682ba08a9d2fd9c", // Drops: D2-ETH
    "0xdf55f91f8f13f6b3754bf07c6ebdf16c99f83198", // Drops: D2-USDC
    "0x05231980914b702083b9ac08002325654f6eb95b", // Drops: D3-ETH
    "0x0a494b848d4be5d58b0fde9f80c9b25592a2d3b2", // Drops: D3-USDC
    "0x588c13e685e44b22dc6647937481c816e5fee086", // Drops: D4-ETH
    "0xe7d7b65dbe5577d9da4286367031f5bccb020674", // Drops: D4-USDC
    "0x777eccd3fcf4ffa3b12f45a384852608df2619a0", // Drops: D5-ETH
    "0x0eabea97c25bd4dfcad294d82404c7df3b26a2cc", // Drops: D5-USDC
    "0x8252df1d8b29057d1afe3062bf5a64d503152bc8", // NFTfi: DirectLoanFixedOfferRedeploy
    "0xe52cec0e90115abeb3304baa36bc2655731f7934", // NFTfi: DirectLoanFixedCollectionOffer
    "0x59b72fdb45b3182c8502cc297167fe4f821f332d", // Paraspace Proxy
  ],
  137: [
    "0x14515508958d4e3b4a16ab10250e36d0b965cc02", // Cyan Payment Plan
    "0x50160ff9c19fbe2b5643449e1a321cac15af2b2c", // PWN
  ],
  42161: [
    "0x1e600b69d5e30e5293c250f554d96adf9acfe990", // DEFRAG Common Genesis Legion Asset Manager V1
    "0xf7ad5e19aa2333a5fe3e970a48a2a9ab482435c5", // DEFRAG Common Genesis Legion Asset Manager V2
    "0x2bec46284915b56b9e961ec8e4bbe68729a92412", // DEFRAG Special Genesis Legion Asset Manager
    "0x73056325f28aabcfe9e1eaf90dc47d74ef97c406", // DEFRAG Rare Genesis Legion Asset Manager
    "0x8d1776dc9c6188f23112d665b006ced16e67812c", // DEFRAG Smols AssetManager
    "0x4d7f40f751fd222c9b56d1ab8f7e5967a8d34f81", // DEFRAG Rare Smols AssetManager
    "0x3b0537e61e5b3e708821592251f734bfc68390af", // DEFRAG GBC Asset Manager
    "0x2de50836c96ce280958e290675e0a52bb1834712", // DEFRAG Smols (on-chain) Asset Manger
  ],
};

export const ZERO = ethers.constants.Zero;

export const ERC20_TRANSFER_EVENT = "event Transfer(address indexed from, address indexed to, uint256 value)";

export const WRAPPED_NATIVE_TOKEN_EVENTS = [
  "event Deposit(address indexed to, uint256 value)",
  "event Withdrawal(address indexed from, uint256 value)",
];

export const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function name() public view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
];

//Llamalend
export const LOAN_CREATED_ABI = [
  "event LoanCreated(uint indexed loanId, address nftContract, uint nft, uint interest, uint startTime, uint216 borrowed)",
];

export interface LargeProfitAddress {
  address: string;
  confidence: number;
  anomalyScore: number;
  isProfitInUsd: boolean;
  profit: number;
}

export const FUNCTION_ABIS = [
  "function burn(int24 tickLower, int24 tickUpper, uint128 amount)",
  "function remove_liquidity(uint256 _amount, uint256[2] min_amounts)",
  "function removeLiquidity(address _tokenA, address _tokenB)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline)",
  "function removeLiquidityWithPermit(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s)",
  "function removeLiquidityETHWithPermit(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s)",
  "function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline)",
  "function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s)",
];
