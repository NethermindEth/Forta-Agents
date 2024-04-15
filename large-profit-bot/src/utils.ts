import {
  EntityType,
  Finding,
  FindingSeverity,
  FindingType,
  Label,
  LogDescription,
  TransactionEvent,
  ethers,
} from "forta-agent";

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
    metadata[`profitAddress${index}`] = address.address.toLowerCase();
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

export const filterAddressesInTracesUnsupportedChains = (
  filteredLargeProfitAddresses: LargeProfitAddress[],
  balanceChangesMapUsd: Map<string, Record<string, number>>,
  txEvent: TransactionEvent
): LargeProfitAddress[] => {
  return filteredLargeProfitAddresses.filter((addressObj) => {
    const balanceChange = balanceChangesMapUsd.get(addressObj.address);

    // Check if balanceChange exists, has only the 'native' key and traces are can't be retrieved
    return !(
      balanceChange &&
      Object.keys(balanceChange).length === 1 &&
      "native" in balanceChange &&
      txEvent.traces.length === 0
    );
  });
};

export const updateBalanceChangesMap = (
  balanceChangesMap: Map<string, Record<string, ethers.BigNumber>>,
  address: string,
  token: string,
  value: ethers.BigNumber
) => {
  if (balanceChangesMap.has(address)) {
    let currentEntry = balanceChangesMap.get(address);
    currentEntry![token] = (currentEntry![token] || ZERO).add(value);
    balanceChangesMap.set(address, currentEntry!);
  } else {
    balanceChangesMap.set(address, { [token]: value });
  }
};

export const isBatchTransfer = (erc20TransferEvents: LogDescription[]) => {
  if (erc20TransferEvents.length <= 50) {
    return false;
  }

  const firstAddress = erc20TransferEvents[0].address;
  for (let i = 1; i < erc20TransferEvents.length; i++) {
    if (erc20TransferEvents[i].address !== firstAddress) {
      return false;
    }
  }

  return true;
};

export const hasMatchingTokenTransfer = (
  txEvent: TransactionEvent,
  balanceChangesMap: Map<string, { [key: string]: ethers.BigNumber }>
): boolean => {
  const toBalanceChanges = balanceChangesMap.get(ethers.utils.getAddress(txEvent.to!));
  const fromBalanceChanges = balanceChangesMap.get(ethers.utils.getAddress(txEvent.from));

  if (!toBalanceChanges || !fromBalanceChanges) {
    return false;
  }

  for (const [toToken, toAmount] of Object.entries(toBalanceChanges!)) {
    if (toAmount.lt(ethers.constants.Zero)) {
      for (const [fromToken, fromAmount] of Object.entries(fromBalanceChanges!)) {
        if (fromAmount.gte(ethers.constants.Zero) && toAmount.abs().eq(fromAmount)) {
          console.log(
            `Matching token transfer found: ${toToken} (${toAmount.toString()}) in txEvent.to matches ${fromToken} (${fromAmount.toString()}) in txEvent.from`
          );
          return true;
        }
      }
    }
  }

  return false;
};

export const MAX_USD_VALUE = 500000;

export const wrappedNativeTokens: Record<number, string> = {
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  10: "0x4200000000000000000000000000000000000006",
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  137: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
};

const FILTERED_OUT_ADDRESSES = [
  "0x00000000000000adc04c56bf30ac9d3c0aaf14dc", // Seaport 1.5,
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff", // 0x Exchange Proxy
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad", // Uniswap Universal Router
  "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b", // Uniswap Universal Router V2
  "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3: Router
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap V3: Router 2
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2: Router 2
  "0x6000da47483062a0d734ba3dc7576ce6a0b645c4", // UniswapX Dutch Auction Reactor
  "0xec8b0f7ffe3ae75d7ffab09429e3675bb63503e4", // Uniswap Universal Router (OP)
  "0xb971ef87ede563556b2ed4b1c0b0019111dd85d2", // Uniswap Swap Router 02 (BSC)
  "0x10ed43c718714eb63d5aa57b78b54704e256024e", // Pancakeswap Router (BSC)
  "0x13f4ea83d0bd40e75c8222255bc855a974568dd4", // Pancakeswap Smart Router V3 (BSC)
  "0x556b9306565093c855aea9ae92a594704c2cd59e", // Pancakeswap MasterChef V3 (BSC)
  "0x46a15b0b27311cedf172ab29e4f4766fbe7f4364", // Pancakeswap NFT Position Manager V3 (BSC)
  "0x881d40237659c251811cec9c364ef91dc08d300c", // Metamask Swap Router (ETH)
  "0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31", // Metamask Swap Router (BSC)
  "0x3c11f6265ddec22f4d049dde480615735f451646", // Swapper (BSC)
  "0xb4315e873dbcf96ffd0acd8ea43f689d8c20fb30", // TraderJoe LB Router (AVAX)
  "0x1111111254eeb25477b68fb85ed929f73a960582", // 1inch Router
  "0x1a8f43e01b78979eb4ef7febec60f32c9a72f58e", // Bitget Swap Router V1 (BSC)
  "0xd1ca1f4dbb645710f5d5a9917aa984a47524f49a", // Bitget Swap Router (BSC)
  "0xdbc1a13490deef9c3c12b44fe77b503c1b061739", // Biswap Masterchef (BSC)
  "0x00000047bb99ea4d791bb749d970de71ee0b1a34", // Transit Finance Router (BSC)
  "0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae", // LI.FI Diamon (BSC),
  "0xd152f549545093347a162dce210e7293f1452150", // Disperse App
  "0x9333c74bdd1e118634fe5664aca7a9710b108bab", // OKX Dex Router (BSC)
  "0xd4ae6eca985340dd434d38f470accce4dc78d109", // Thena Router (BSC)
  "0xd50cf00b6e600dd036ba8ef475677d816d6c4281", // Radiant Lending Pool (BSC)
  "0xce16F69375520ab01377ce7B88f5BA8C48F8D666", // Squid Router (BSC)
  "0x53e0e51b5ed9202110d7ecd637a4581db8b9879f", // Dooar Swap Router V2 (BSC)
  "0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff", // QuickSwap Router (Polygon)
  "0xf5b509bb0909a69b1c207e495f687a596c168e12", // QuickSwap Router V3 (Polygon)
  "0xf3a3d1b89a70e291531ecb4a1299117f5de44612", // Meta Force: Tactile Matrix Classic (Polygon)
  "0x415d01fc2266e3c5908e94b8958057936911bed8", // Meta Force: Uniteverse (Polygon)
  "0x75dc8e5f50c8221a82ca6af64af811caa983b65f", // Layer Zero: Relayer V2 (Polygon)
  "0xa27a2ca24dd28ce14fb5f5844b59851f03dcf182", // Layer Zero: Relayer V2 (BSC)
  "0x0c1ebbb61374da1a8c57cb6681bf27178360d36f", // Layer Zero Bridge agEUR (Polygon)
  "0xec7be89e9d109e7e3fec59c222cf297125fefda2", // Uniswap Universal Router V1 2 V2 Support (Polygon)
  "0xc36442b4a4522e871399cd717abdd847ab11fe88", // Uniswap V3: Positions NFT (Polygon),
  "0xdef171fe48cf0115b1d80b88dc8eab59176fee57", // Paraswap V5: Augustus Swapper (Polygon)
  "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789", // ERC-4337 Entry Point 0.6.0
  "0x6131b5fae19ea4f9d964eac0408e4408b66337b5", // Kyberswap: Meta Aggregation Router V2
  "0xbeb09000fa59627dc02bb55448ac1893eaa501a5", // Bepop: Settlement (Polygon)
  "0xbebebeb035351f58602e0c1c8b59ecbff5d5f47b", // Bepop: JamSettlement (Polygon)
  "0x78852a22b6178406683afea36d1e4bdd2ff9c08d", // PIX Marketplace (Polygon)
  "0xa748d6573aca135af68f2635be60cb80278bd855", // OKX Dex Router (Polygon)
  "0x111111125421ca6dc452d289314280a0f8842a65", // 1inch Router
  "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch Router v4
  "0x9008d19f58aabd9ed0d60971565aa8510560ab41", // CoW Protocol: GPv2Settlement (Ethereum)
  "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43", // Coinbase 10 (Ethereum)
  "0x3328f7f4a1d1c57c35df56bbf0c9dcafca309c49", // Banana Gun: Router V2 (Ethereum)
  "0x80a64c6d7f12c47b7c66c5b4e20e72bc1fcd5d9e", // Maestro: Router V2 (Ethereum)
  "0xba12222222228d8ba445958a75a0704d566bf2c8", // Balancer Vault (Ethereum)
  "0xe66b31678d6c16e9ebf358268a790b763c133750", // 0x: Coinbase Wallet Proxy
  "0xbcd7254a1d759efa08ec7c3291b2e85c5dcc12ce", // LooksRare Fee Sharing (Ethereum)
  "0xd91efec7e42f80156d1d9f660a69847188950747", // KuCoin ERC-20 Batch Transfer (Ethereum)
  "0x3a23f943181408eac424116af7b7790c94cb97a5", // Socket Gateway (BSC)
  "0x89b8aa89fdd0507a99d334cbe3c808fafc7d850e", // Odos Router V2 (BSC)
  "0xcf5540fffcdc3d510b18bfca6d2b9987b0772559", // Odos Router V2 (Ethereum)
  "0xa669e7a0d4b3e4fa48af2de86bd4cd7126be4e13", // Odos Router V2 (Arbitrum)
  "0xcf0febd3f17cef5b47b0cd257acf6025c5bff3b7", // Apeswap Router (BSC)
  "0xb099ed146fad4d0daa31e3810591fc0554af62bb", // Bogged Finance Router (BSC)
  "0xca10e8825fa9f1db0651cd48a9097997dbf7615d", // WooFi Cross Swap Router (BSC)
  "0x78e51e1420477a50f5ae0cd40ebf6d81bc283e3a", // Matrix Chain Vote Contract (BSC)
  "0x8a226b70dceb9656eb75545424400128fcef9d9e", // Radiant Capital wETH Gateway (BSC)
  "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11", // Aavegotchi: Gotchiverse REALM Diamon (Polygon)
  "0x19f870bd94a34b3adaa9caa439d333da18d6812a", // Aavegotchi: InstallationDiamond Token (Polygon)
  "0x00000000005bbb0ef59571e58418f9a4357b68a0", // Pendle: Router V3 (Arbitrum)
  "0x03f34be1bf910116595db1b11e9d1b2ca5d59659", // Tokenlon: DEX 2 (Ethereum),
  "0x1a0a18ac4becddbd6389559687d1a73d8927e416", // PancakeSwap Universal Router (BSC)
  "0x196bf3a63c50bca1eff5a5809b72dfc58f0c2c1a", // Radiant Capital: Leverager (Arbitrum)
  "0xf491e7b69e4244ad4002bc14e878a34207e38c29", // Spookyswap: Router (Fantom)
];

export const filteredOutAddressesSet = new Set(FILTERED_OUT_ADDRESSES.map((address) => address.toLowerCase()));

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
export const ERC721_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)";

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

export const GNOSIS_PROXY_EVENT_ABI = ["event ExecutionSuccess(bytes32 txHash, uint256 payment)"];

export const GEARBOX_CREDIT_FACADE_EVENT_ABI = [
  "event StartMultiCall(address indexed creditAccount, address indexed caller)",
];

export const EXECUTE_FUNCTION_ABI = ["function execute(address target, bytes data)"];

export interface LargeProfitAddress {
  address: string;
  confidence: number;
  anomalyScore: number;
  isProfitInUsd: boolean;
  profit: number;
}

export const FUNCTION_ABIS = [
  "function remove_liquidity(uint256 _amount, uint256[2] min_amounts)",
  "function removeLiquidity(address _tokenA, address _tokenB)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline)",
  "function removeLiquidityWithPermit(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s)",
  "function removeLiquidityETHWithPermit(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s)",
  "function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline)",
  "function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s)",
  "function removeLiquidity(uint256 id, uint32 portion)",
  "function burn(int24 tickLower, int24 tickUpper, uint128 amount)",
  "function borrow(uint256 amount, uint64 maxAPR)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)",
  "function swap(uint256 amount)",
  "function withdrawAndUnwrap(uint256 amount)",
];

export const EVENTS_ABIS = [
  "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event WithdrawFromPosition(uint256 indexed tokenId, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event Burn(address indexed from, address indexed target, uint256 value, uint256 index)",
  "event RewardClaimed(bytes32 indexed identifier, address indexed token, address indexed account, uint256 amount)", // Redacted Finance
];
