const abi = [
  {
    name: "TokenExchange",
    inputs: [
      { type: "address", name: "buyer", indexed: true },
      { type: "int128", name: "sold_id", indexed: false },
      { type: "uint256", name: "tokens_sold", indexed: false },
      { type: "int128", name: "bought_id", indexed: false },
      { type: "uint256", name: "tokens_bought", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "TokenExchangeUnderlying",
    inputs: [
      { type: "address", name: "buyer", indexed: true },
      { type: "int128", name: "sold_id", indexed: false },
      { type: "uint256", name: "tokens_sold", indexed: false },
      { type: "int128", name: "bought_id", indexed: false },
      { type: "uint256", name: "tokens_bought", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "AddLiquidity",
    inputs: [
      { type: "address", name: "provider", indexed: true },
      { type: "uint256[3]", name: "token_amounts", indexed: false },
      { type: "uint256[3]", name: "fees", indexed: false },
      { type: "uint256", name: "invariant", indexed: false },
      { type: "uint256", name: "token_supply", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RemoveLiquidity",
    inputs: [
      { type: "address", name: "provider", indexed: true },
      { type: "uint256[3]", name: "token_amounts", indexed: false },
      { type: "uint256[3]", name: "fees", indexed: false },
      { type: "uint256", name: "token_supply", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RemoveLiquidityOne",
    inputs: [
      { type: "address", name: "provider", indexed: true },
      { type: "uint256", name: "token_amount", indexed: false },
      { type: "uint256", name: "coin_amount", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RemoveLiquidityImbalance",
    inputs: [
      { type: "address", name: "provider", indexed: true },
      { type: "uint256[3]", name: "token_amounts", indexed: false },
      { type: "uint256[3]", name: "fees", indexed: false },
      { type: "uint256", name: "invariant", indexed: false },
      { type: "uint256", name: "token_supply", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "CommitNewAdmin",
    inputs: [
      { type: "uint256", name: "deadline", indexed: true },
      { type: "address", name: "admin", indexed: true },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "NewAdmin",
    inputs: [{ type: "address", name: "admin", indexed: true }],
    anonymous: false,
    type: "event",
  },
  {
    name: "CommitNewFee",
    inputs: [
      { type: "uint256", name: "deadline", indexed: true },
      { type: "uint256", name: "fee", indexed: false },
      { type: "uint256", name: "admin_fee", indexed: false },
      { type: "uint256", name: "offpeg_fee_multiplier", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "NewFee",
    inputs: [
      { type: "uint256", name: "fee", indexed: false },
      { type: "uint256", name: "admin_fee", indexed: false },
      { type: "uint256", name: "offpeg_fee_multiplier", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RampA",
    inputs: [
      { type: "uint256", name: "old_A", indexed: false },
      { type: "uint256", name: "new_A", indexed: false },
      { type: "uint256", name: "initial_time", indexed: false },
      { type: "uint256", name: "future_time", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "StopRampA",
    inputs: [
      { type: "uint256", name: "A", indexed: false },
      { type: "uint256", name: "t", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    outputs: [],
    inputs: [
      { type: "address[3]", name: "_coins" },
      { type: "address[3]", name: "_underlying_coins" },
      { type: "address", name: "_pool_token" },
      { type: "address", name: "_aave_lending_pool" },
      { type: "uint256", name: "_A" },
      { type: "uint256", name: "_fee" },
      { type: "uint256", name: "_admin_fee" },
      { type: "uint256", name: "_offpeg_fee_multiplier" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    name: "A",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 5199,
  },
  {
    name: "A_precise",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 5161,
  },
  {
    name: "dynamic_fee",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "int128", name: "i" },
      { type: "int128", name: "j" },
    ],
    stateMutability: "view",
    type: "function",
    gas: 10278,
  },
  {
    name: "balances",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [{ type: "uint256", name: "i" }],
    stateMutability: "view",
    type: "function",
    gas: 2731,
  },
  {
    name: "get_virtual_price",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2680120,
  },
  {
    name: "calc_token_amount",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256[3]", name: "_amounts" },
      { type: "bool", name: "is_deposit" },
    ],
    stateMutability: "view",
    type: "function",
    gas: 5346581,
  },
  {
    name: "add_liquidity",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256[3]", name: "_amounts" },
      { type: "uint256", name: "_min_mint_amount" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "add_liquidity",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256[3]", name: "_amounts" },
      { type: "uint256", name: "_min_mint_amount" },
      { type: "bool", name: "_use_underlying" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "get_dy",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "int128", name: "i" },
      { type: "int128", name: "j" },
      { type: "uint256", name: "dx" },
    ],
    stateMutability: "view",
    type: "function",
    gas: 6239547,
  },
  {
    name: "get_dy_underlying",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "int128", name: "i" },
      { type: "int128", name: "j" },
      { type: "uint256", name: "dx" },
    ],
    stateMutability: "view",
    type: "function",
    gas: 6239577,
  },
  {
    name: "exchange",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "int128", name: "i" },
      { type: "int128", name: "j" },
      { type: "uint256", name: "dx" },
      { type: "uint256", name: "min_dy" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    gas: 6361682,
  },
  {
    name: "exchange_underlying",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "int128", name: "i" },
      { type: "int128", name: "j" },
      { type: "uint256", name: "dx" },
      { type: "uint256", name: "min_dy" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    gas: 6369753,
  },
  {
    name: "remove_liquidity",
    outputs: [{ type: "uint256[3]", name: "" }],
    inputs: [
      { type: "uint256", name: "_amount" },
      { type: "uint256[3]", name: "_min_amounts" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "remove_liquidity",
    outputs: [{ type: "uint256[3]", name: "" }],
    inputs: [
      { type: "uint256", name: "_amount" },
      { type: "uint256[3]", name: "_min_amounts" },
      { type: "bool", name: "_use_underlying" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "remove_liquidity_imbalance",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256[3]", name: "_amounts" },
      { type: "uint256", name: "_max_burn_amount" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "remove_liquidity_imbalance",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256[3]", name: "_amounts" },
      { type: "uint256", name: "_max_burn_amount" },
      { type: "bool", name: "_use_underlying" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "calc_withdraw_one_coin",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256", name: "_token_amount" },
      { type: "int128", name: "i" },
    ],
    stateMutability: "view",
    type: "function",
    gas: 4449067,
  },
  {
    name: "remove_liquidity_one_coin",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256", name: "_token_amount" },
      { type: "int128", name: "i" },
      { type: "uint256", name: "_min_amount" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "remove_liquidity_one_coin",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "uint256", name: "_token_amount" },
      { type: "int128", name: "i" },
      { type: "uint256", name: "_min_amount" },
      { type: "bool", name: "_use_underlying" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "ramp_A",
    outputs: [],
    inputs: [
      { type: "uint256", name: "_future_A" },
      { type: "uint256", name: "_future_time" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    gas: 151954,
  },
  {
    name: "stop_ramp_A",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 148715,
  },
  {
    name: "commit_new_fee",
    outputs: [],
    inputs: [
      { type: "uint256", name: "new_fee" },
      { type: "uint256", name: "new_admin_fee" },
      { type: "uint256", name: "new_offpeg_fee_multiplier" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    gas: 146482,
  },
  {
    name: "apply_new_fee",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 133744,
  },
  {
    name: "revert_new_parameters",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 21985,
  },
  {
    name: "commit_transfer_ownership",
    outputs: [],
    inputs: [{ type: "address", name: "_owner" }],
    stateMutability: "nonpayable",
    type: "function",
    gas: 74723,
  },
  {
    name: "apply_transfer_ownership",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 60800,
  },
  {
    name: "revert_transfer_ownership",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 22075,
  },
  {
    name: "withdraw_admin_fees",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 71651,
  },
  {
    name: "donate_admin_fees",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 62276,
  },
  {
    name: "kill_me",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 38058,
  },
  {
    name: "unkill_me",
    outputs: [],
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    gas: 22195,
  },
  {
    name: "set_aave_referral",
    outputs: [],
    inputs: [{ type: "uint256", name: "referral_code" }],
    stateMutability: "nonpayable",
    type: "function",
    gas: 37325,
  },
  {
    name: "coins",
    outputs: [{ type: "address", name: "" }],
    inputs: [{ type: "uint256", name: "arg0" }],
    stateMutability: "view",
    type: "function",
    gas: 2310,
  },
  {
    name: "underlying_coins",
    outputs: [{ type: "address", name: "" }],
    inputs: [{ type: "uint256", name: "arg0" }],
    stateMutability: "view",
    type: "function",
    gas: 2340,
  },
  {
    name: "admin_balances",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [{ type: "uint256", name: "arg0" }],
    stateMutability: "view",
    type: "function",
    gas: 2370,
  },
  {
    name: "fee",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2291,
  },
  {
    name: "offpeg_fee_multiplier",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2321,
  },
  {
    name: "admin_fee",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2351,
  },
  {
    name: "owner",
    outputs: [{ type: "address", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2381,
  },
  {
    name: "lp_token",
    outputs: [{ type: "address", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2411,
  },
  {
    name: "initial_A",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2441,
  },
  {
    name: "future_A",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2471,
  },
  {
    name: "initial_A_time",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2501,
  },
  {
    name: "future_A_time",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2531,
  },
  {
    name: "admin_actions_deadline",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2561,
  },
  {
    name: "transfer_ownership_deadline",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2591,
  },
  {
    name: "future_fee",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2621,
  },
  {
    name: "future_admin_fee",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2651,
  },
  {
    name: "future_offpeg_fee_multiplier",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2681,
  },
  {
    name: "future_owner",
    outputs: [{ type: "address", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
    gas: 2711,
  },
];

export default abi;
