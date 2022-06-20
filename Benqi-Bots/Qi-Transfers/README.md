# QI Token Large Transfer and Large Balance bot

## Description

This bot detects transfers of a large amount of `QI` tokens and accounts with large amount of `QI` balance.

- Threshold for transferred token amount can be set at `src/utils.ts` line 17. The default amount is set to 1 million tokens.

```
const THRESHOLD_TRANSFER_AMOUNT: number = 1000000;
```

- Threshold percentage of `QI` token total supply for balances can be set `src/utils.ts` line 16. The default value is set to 5 percent.

```
const THRESHOLD_BALANCE_PERCENTAGE: number = 5;
```

## Supported Chains

- Avalanche

## Alerts

- BENQI-3-1

  - Fired when the amount of transferred `QI` tokens are above threshold value
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - from: Source address
    - to: Destination address
    - amount: The amount of transferred tokens

- BENQI-3-2
  - Fired when balance of the destination account of a transfer is more than threshold percentage of the total supply
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata includes:
    - account: The account that is receiving the tokens
    - balance: Balance of the account

## Test Data

### Mainnet

The bot behaviour can be verified with the following test transactions in `AVAX Mainnet Network` if `TRANSFERED_TOKEN_THRESHOLD` is lowered to 6000.

- 0x86cec2063f9f9941823b69d16c7cdc729ad21bc4d1384f203ad2c852c1e7c1c4 (Large Transfer and Large Balance)

### Testnet

A PoC `QI Token Contract` is deployed on `AVAX Testnet Network` to catch the monitored conditions.
In order to run this bot on `AVAX Testnet Network`, two steps must be done:

1. `isTestnet` variable must be changed to `true` at `src/utils.ts` line 8:

```
const isTestnet: boolean = true;
```

Default value is false, which means the bot will run for `QI Token Contract` deployed in `AVAX Mainnet` if it's not changed to `true`.

2. `jsonRpcUrl` in `forta.config.json` must be `https://api.avax-test.network/ext/bc/C/rpc`

The bot behaviour can be verified with the following test transactions in `AVAX Testnet Network`:

- 0x02a6f7f16bd58994e8d780bb428a3351bd4268ec177e2768efcb0b2f38cabe94 (Large Transfer)
- 0x9480a4e49be58b564e270960c41f04311881d0e134634bdda0210b07f7a1a853 (Large Balance)
- 0x85c9eab54973d8fe2cc6efef05cd6aceecb406b849ed55b5808951dd872dc647 (Large Transfer and Large Balance)
