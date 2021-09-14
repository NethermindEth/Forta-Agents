# Forta-Agents

Proof-of-concept Forta Agents by the Venice team.

## Agent List

- **Multi-Gas Threshold**: Detects when an unusual amount of gas gets used.
- **Anomalous Tx Value**: Detects txns using a very high tx value.
- **High volume of failed transactions**: Detects protocols receiving a high volume of failed txns.
- **Ownership Transfer**: Detects OwnershipTransferred events.
- **Flash Loan**: Detects the use of a flash loan.
- **TimeLock**: Detects the use of the OpenZeppelin Timelock.
- **Detect Upgrade Events**: Detects upgrade events of a single or all contracts.
- **Detect Unusual Block Difficulty**: The agent checks for unusual changes in Block Difficulty.
- **Compound Gov Event Tracker**: Detects any compound governance event.
- **High Utilization of Aave Reserves**: Detects high usage values on `USDC`, `DAI`, and `USDT` reserves on Aave.
- **MEV Tracker**: Detects contract interactions that are inside an MEV bundle.
- **Recently-created Smart Contracts with Short History**: Detects txns to contracts recently created or with a short history.
- **Contracts deployed by contracts**: Detects when a contract deploys a new contract.
- **Gnosis Safe admin changes**: Detects txns that emit gnosis safe events of admin or threshold changes.
- **Initialize**: Detects if the initialize function is called multiple times.
- **Hight Flash Loan Value**: Detects if a flash loan with a considerable amount gets used.
- **Possible locked NFTs**: Detects txns that may lock an NFT in a contract.
- **Chainkeeper**: Detects txns involving blacklisted addresses.
- **Success txn with internal failures**: Detects txns with internal failures.
- **Yearn Strategy without call Harvest**:  Detects yearn strategies that haven't called harvest in a long time.
- **Tornado Cash 1**: Detects addresses that sent more than 100 eth into Tornado Cash in one day.
- **Reentrancy Counter**: Detects txns with multiple nested calls to the same contract.
