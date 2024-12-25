# Forta-Agents

Forta Agents proof of concepts from **Venice** team.

## Agent List

- **Multi Gas Threshold**: Detect unusual amount of gas used.
- **Anomalous Tx Value**: Detect transactions using very high tx value.
- **High volume of failed transactions**: Detect protocols receiving a high volume of failed transactions.
- **Onwership Transfer**: Detect OwnershipTrasnferred events.
- **Flash Loan**: Detects use of flash loan.
- **TimeLock**: Detects use of Openzeppelin Timelock.
- **Detect Upgrade Events**: The agent detects upgrade events either for a specific contract or for any
- **Detect Unusual Block Difficulty**: The agent checks for unusual changes in Block difficulty.
- **Compound Gov Event Tracker**: The agent detect any compound governance event.
- **High Utilization of Aave Reserves**: The agent detects high utilization values on `USDC`, `DAI` and `USDT` reserves on Aave.
- **MEV Tracker**: The agent detects contract interactions which are inside MEV bundle.
- **Recently-created Smart Contracts with Little History**: Detect txns to contracts recently-created or with little history.
- **Contracts deployed by contracts**: Detect when a contract deploys a new contract.
- **Gnosis Safe admin changes**: Detect transactions that emits gnosis safe events of admin or threshold changes.
- **Initialize**: Detects if the initialize function is called multiple times.
- **Hight Flash Loan Value**: Detects if a flash loan with huge amount is used.
- **Possible locked NFTs**: Detect transactions that may lock an NFT in a contract.
- **Chainkeeper**: Detects transactions involving blacklisted addresses.
- **Success txn with internal failures agent**: Detect transactions with internal failures.
- **Yearn Strategy without call Harvest**: Detects yearn strategies that haven't call harvest in too much time
- **Tornado Cash 1**: Detects addresses that sent more than 100 eth into Tornado Cash in one day.
- **Reentrancy Counter**: Detects transactions with multiples nested calls to the same contract.
- **Curve Finance Agents Suit**: Provides a list of agents that related to Curve contracts.
- **YFI governance changes**: Detect transactions that change the YFI governance address
