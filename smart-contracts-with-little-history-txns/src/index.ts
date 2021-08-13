import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import axios from 'axios';

const ETHERSCAN_API_TOKEN: string = "YourApiKeyToken";
const ETHERSCAN_API_ENDPOINT: string = "https://api.etherscan.io/api?module=account&action=txlistinternal&sort=asc";
const HISTORY_THRESHOLD: number = 10000;
const TIMESTAMP_THRESHOLD: number = 5 * 30 * 24 * 60 * 60; // 5 months aprox

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  if(txEvent.to === null) return [];

  const address: string = txEvent.to;
  const url: string = `${ETHERSCAN_API_ENDPOINT}&address=${address}&apiKey=${ETHERSCAN_API_TOKEN}`;
  const { data } = await axios.get(url);
  
  if(data.result.length === 0) return [];
  if(data.result[0].contractAddress !== address) return [];

  const findings: Finding[] = [];
  
  if(data.result.length < HISTORY_THRESHOLD){
    findings.push(Finding.fromObject({
      name: "Transaction to an smart contract with little history",
      description: `Contract (${address}) has only ${data.result.length} internal transactions`,
      alertId: "NETHERMIND-AGENTS-02",
      type: FindingType.Suspicious,
      severity: FindingSeverity.Medium,
    }));
  }
  if(data.result[0].timestamp + TIMESTAMP_THRESHOLD >= txEvent.timestamp){
    const date: Date = new Date(data.result[0].timestamp * 1000);

    findings.push(Finding.fromObject({
      name: "Transaction to an smart contract recently created",
      description: `Contract created on ${date.toUTCString()}`,
      alertId: "NETHERMIND-AGENTS-02",
      type: FindingType.Suspicious,
      severity: FindingSeverity.High,
    }));
  }

  return findings;
};

export default {
  handleTransaction,
};
