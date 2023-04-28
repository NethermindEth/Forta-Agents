# Large Profit Bot

## Description

This agent detects transactions resulting in a large profit (>$10000 or more than 5% of the token's total supply) for the initiator.

> The bot uses Moralis and block explorer APIs. In order to increase performance, add your own API keys to the `src/keys.ts` file.

## Supported Chains

- Ethereum
- Optimism
- BNB Smart Chain
- Polygon
- Fantom
- Arbitrum
- Avalanche

## Alerts

- LARGE-PROFIT

  - Fired when a transaction results in a large profit for the initiator.
  - Severity is set to "Medium" (or "Info" in the case of the called contract either being verified or having a high number of past transaction)
  - Type is always set to "Suspicious"
  - Metadata contains:

    - `txFrom`: The transaction initiator
    - `txTo`: The contract called
    - `anomalyScore`: The "inverse" of the Confidence Level (i.e. if CL is 0.7, then the anomalyScore is set to 0.3)
    - `profit#`: The profit of the transaction
      > This property could have more than one instance appear in the alert's `metadata`, and thus each will be properly enumerated.

  - Labels contain:
    - First Label(s):
      - `entity`: The address that received the large profit
      - `entityType`: The type of the entity, always set to "Address"
      - `label`: The type of the label, always set to "Large Profit Receiver"
      - `confidence`: The confidence level of the address receiving a large profit (0-1).
        > The Confidence Level is determined either based on the USD value (with $500000 or more being the CL: 1 and by then splitting the CL into 10 parts) or based on the percentage of the token's total supply in which case there are 4 levels of confidence (5%-9%: CL 0.7, 10%-19%: CL 0.8, 20-29%%: CL 0.9, >30%: CL 1)
      - `remove`: Always set to false.
    - Last Label :
      - `entity`: The transaction hash
      - `entityType`: The type of the entity, always set to "Transaction"
      - `label`: The type of the label, always set to "Large Profit Transaction"
      - `confidence`: The confidence level of the transaction resulting in a large profit, always set to "1".
      - `remove`: Always set to false.

## Test Data

The bot behaviour can be verified with the following transactions:

- [0xd099a41830b964e93415e9a8607cd92567e40d3eeb491d52f3b66eee6b0357eb](https://etherscan.io/tx/0xd099a41830b964e93415e9a8607cd92567e40d3eeb491d52f3b66eee6b0357eb) (Ethereum)
- [0x0053490215baf541362fc78be0de98e3147f40223238d5b12512b3e26c0a2c2f](https://polygonscan.com/tx/0x0053490215baf541362fc78be0de98e3147f40223238d5b12512b3e26c0a2c2f) (Polygon)
