### Overview

In general, we want to establish an alert-response system across fuse so that we can monitor and respond to threats or irregularities to the protocol. We want a more personalized experience and intend on using PagerDuty + DataDog integration in tandem to have 1) an on-call report system for threats and 2) potentially have security dashboards. Currently, transactions to fuse are specced out to be watched by OpenZeppelin Sentinels and containers on vms that can handle higher contract bandwidth/throughput like for individual positions. We may use OZ sentinels to handle your forta/nethermind notifs, or we can figure something else out.

### Addresses && ABIs

`Directory`:
ABI- https://github.com/Rari-Capital/rari-dApp/blob/master/src/fuse-sdk/src/abi/FusePoolDirectory.json
Mainnet Address- `0x835482FE0532f169024d5E9410199369aAD5C77E`

`Pool`:
ABI / Implementation- https://etherscan.io/address/0xE16DB319d9dA7Ce40b666DD2E365a4b8B3C18217#code
Individual Pools- Directory.getAllPools() -> address[]
`cToken(market)`:
ABI / Implementation- https://etherscan.io/address/0x67Db14E73C2Dce786B5bbBfa4D010dEab4BBFCF9#code
Individual markets- Pool.allMarkets()

### Alerts

`Note on priority\*
We should decide a standard categorization of priority for alerts, colored, 1-5, etc. We can parse whatever we decide on

`Node on call throughput`
This proposal assumes that the fora nodes nethermind runs are full nodes with IPC capabilities, if this is not the case, some of the below monitoring may not be feasible and we can include them with high security monitoring we are building in-house

#### Oracle Status

Fuse allows pool owners to use Uniswap twap oracles, chainlink oracles, or a custom oracle for the price data of the underlying assets of ctokens. ABIs for oracles can be found at https://github.com/Rari-Capital/rari-dApp/tree/master/src/fuse-sdk/src/contracts/oracles

Store: - Underlying Addresses + Chainlink && Uni default oracles for the asset: It may be beneficial for your infrastructure/response time to store all underlying assets in fuse in a db, JSON, or at the very least in memory upon starting the server app, then update them if new ones are added by pool owners to the protocol (see Admin Events #1)

Watch: - Sudden change in oracle prices - Discrepancy between default oracles

Notify: - Network - Alert Type - Alert Name - oracle address(s) - Data - txn hash of new price ping / nudge(s) - relevant price data, etc

#### Liquidity Status

We want to monitor the liquidity of pools and individual markets. The aggregate liquidity of all markets in a pool should be held to a more conservative standard than a single market. We should be able to arbitrarily set liquidity standards that must be violated to send an alert (perhaps at different levels of liquidity / severity)

Store: - Pool(comptroller) addresses: - query: directory.getAllPools() || predetermined list of "verified" pools - cToken(market) addresses: - query: pool.getAllMarkets() - cToken Collateral Factor Mantissa: - query: pool.markets(cToken address)[1] - see https://docs.rari.capital/fuse/#collateral-factor - cToken current balances: (see below option 1)

Watch:
cTokens: - option 1) regularly query all cTokens of pools being watched for supply of underlying (getBalance() || getCash()??) and borrow of underlying(totalBorrowsCurrent()). - option 2) Subscribe to events emitted that effect balances after storing last checked balances (Mint, Repay, Redeem, Redeem underlying) (see Admin Events #4 for Collateral Factor)

Notify: - Network - Type (Liquidity Alert) - Name (cToken liquidity / pool liquidity) - Data - If ctoken alert: - ctoken address - underlying address - pool address - liquidity + more (we will discuss options) - if pool alert: - pool (comptroller) address - liquidity + more

#### Admin Events

Administrative events are txns from pool owners making a change to their pool. Some of these are already being handled by our sentinel and autotasks, but some may be helpful to implement for Nethermind's Fuse monitoring system.

Standard Notification for Admin Events: - Network - Type (Admin Event) - Name (see #'s below) - Notif Data - Priority (we can decide on a standard) - Params (always return params from event / txn) - Specific data (see below)

Watch:

1. Market(cToken) added/removed:
   EvenSig: MarketListed(address) || MarketUnlisted(address) 1) address- market added or removed
   Store: - If underlying of an added market is not accounted for, then begin to track its default oracles
   Notif Data: - Higher priority level if one of specified pools

2. Liquidation Incentive changed:
   EventSig: NewLiquidationIncentive(uint256,uint256) 1) uint- old liq incentive mantissa (see docs) 2) uint- new liq incentive
   Notif Data: - Higher priority level if one of specified pools

3. Price oracle changed:
   EventSig: NewPriceOracle(address,address) 1) address- old price oracle address 2) address- new price oracle address
   Notif Data:  
    - if not default oracle, increased priority

4. Collateral factor changed:
   EventSig: NewCollateralFactor(address,uint256,uint256) 1) address- address of market(ctoken) 2) uint256- old [CF mantissa](https://docs.rari.capital/fuse/#collateral-factor) 3) uint256- new CF mantissa
   Notif Data: - higher priority level if the CF violates a DAO-standard list of CFs for underlying assets in fuse && if the market belongs to one of the specified pools

5. Market Action Paused
   EventSig: ActionPaused(address,string,bool) 1) address- market affected 2) string- name of action toggled 3) bool- true if paused, false unpaused
   Notif Data: - I need to work out with the team which actions require a response, but in general we need alerts coming out of this we can parse in the future

6. Pool Action Paused
   EventSig: ActionPaused(string,bool) 1) string- name of action toggled 2) bool- true if paused, false unpaused
   Notif Data: - Same as the above but higher priority, we will likely be vigilant for this out of the gate as this means all the markets in a pool are altered

#### Contract interaction from a specific set of addresses

Store: 1) Set of relevant fuse addresses 2) Set of blacklisted addresses

Watch: 1) If a blacklisted address interacts with tornado 2) If a blacklisted address deploys a contract 3) If a blacklisted address tries to deploy or manage a pool

Notify: - Network - Type (Blacklist Alert) - Name (1, 2, or 3) - Data - case 1: - violator address - eth / usdc sent or received from tornado - case 2: - violator address - contract address - fuse targeted addresses (if any) - Potentially subscribe to interactions with this contract - case 3: - violator address - blacklisted pool address

#### Newly created contract

Watch: 1) bytecode of recent pending contract deployments containing fuse addresses

Notify: - Network - Type - Data - Sender address - Contract address - Fuse address targeted - transaction hash and/or metadata
