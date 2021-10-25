import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType, 
  getJsonRpcUrl
} from 'forta-agent';
import AaveFetcher, { TokenData } from './aave.fetcher';
import Web3 from 'web3';
import { 
  provideEventCheckerHandler,
  decodeParameter, 
} from 'forta-agent-tools';

const web3: Web3 = new Web3(getJsonRpcUrl());
export const UPGRADED: string = "Upgraded(address)";
const AAVE_PROVIDER = "0x057835ad21a177dbdd3090bb1cae03eacf78fc6d";
const fetcher: AaveFetcher = new AaveFetcher(web3.eth.call, AAVE_PROVIDER);

const createFindingGenerator = (symbol: string) => 
  (metadata: { [key: string]: any } | undefined): Finding => {
    const implementation = decodeParameter(
      'address',
      metadata?.topics[1],
    );

    return Finding.fromObject({
      name: 'Aave aToken implementation changed',
      description: `Token ${symbol} modified`,
      alertId: "VESPER-8",
      type: FindingType.Info,
      severity: FindingSeverity.High,
      protocol: 'Aave',
      metadata: {
        tokenSymbol: symbol,
        tokenAddress: metadata?.address,
        newImplementation: implementation,
      }
    })
  };

export const provideHandleTransaction = (fetcher: AaveFetcher): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];  

    const tokens: TokenData[] = await fetcher.getTokens(txEvent.blockNumber);
    for(let token of tokens){
      const handler: HandleTransaction = provideEventCheckerHandler(
        createFindingGenerator(token.symbol),
        UPGRADED,
        token.address,
      );
      findings.push(...await handler(txEvent));
    }
  
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(fetcher),
};
