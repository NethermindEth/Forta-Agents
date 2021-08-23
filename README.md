# Forta-Agents

Forta Agents proof of concepts from **Venice** team.

## Agent List

- **Multi Gas Threshold**: Detect unusual amount of gas used.
- **Anomalous Tx Value**: Detect transactions that is being used very high tx value.
- **High volume of failed transactions**: Detect protocols that receive a high volume of failed transactions.
- **Onwership Transfer**: Detect OwnershipTrasnferred events.
- **Flash Loan**: Detects use of flash loan.
- **TimeLock**: Detects use of Openzeppelin Timelock.
- **Detect Upgrade Events**: The agent detects upgrade events either for a specific contract or for any
- **Detect Unusual Block Difficulty**: The agent checks unusual changes in Block difficulty.
- **Compound Gov Event Tracker**: The agent detect any compound governance event.
- **Initialize Function Calls** : The agent to detect multiple call to initialize function, indicating suspicious activity.
- **High Utilization of Aave Reserves**: The agent detect high values on `USDC`, `DAI` and `USDT` reserves on Aave.