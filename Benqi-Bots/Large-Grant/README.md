# Large QI Grant bot

## Description

This bot detects large QI grants by monitoring `QiGranted` event logs in the
Comptroller contract.

The way a grant is classified as large can be modified in the `agent.config.ts` file.

## Supported Chains

- Avalanche

## Alerts

- BENQI-4
  - Fired when there's a large QI grant.
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - `recipient`: Address of the grant recipient
    - `amount`: Amount granted

## Test Data

Since there's no testing data in Avalanche mainnet, a PoC was developed
and deployed in the Avalanche Fuji testnet. The PoC source code is inside
the `PoC/` directory.

The bot behaviour can be verified by:

1. Setting the following values in `agent.config.ts` to the testnet addresses:

```TS
const CONFIG: AgentConfig = {
  /**
   * AgentConfig.qiAddress:
   *    The address of the QI token.
   */
  qiAddress: "0x922c6f4ed54b67a8829499975c8eb32321b530bb",

  /**
   * AgentConfig.comptrollerAddress:
   *    The address of the Comptroller contract.
   */
  comptrollerAddress: "0xadcc6703e4496969d477b1094db85efc8b88e041",

  // [...]
```

2. Setting the `jsonRpcUrl` value inside `forta.config.json` to `https://api.avax-test.network/ext/bc/C/rpc`.

3. Verifying the findings in the following testnet transactions:

- `0x8544671ea2e8c7ccf41babb5d7ff31b63e7ca4473bbbdd80365b369715954e57`

  Should trigger one finding if `CONFIG.thresholdMode` is set to `ABSOLUTE`
  and `CONFIG.threshold` is less than or equal to `10`.

- `0xd315227ca6f6c8e1de6c69c169538f52ed6a032cc518e1d9b5d95e4ec4035d7a`

  Should trigger one finding if `CONFIG.thresholdMode` is set to
  `PERCENTAGE_TOTAL_SUPPLY` and `CONFIG.threshold` is less than or equal
  to `10`.

- `0x9fda808c76a819a65d357d7f37eeb502fc5a04e798772a3af0b59c863f141933`

  Should trigger one finding if `CONFIG.thresholdMode` is set to
  `PERCENTAGE_COMPTROLLER_BALANCE` and `CONFIG.threshold` is less than or
  equal to `10`.
