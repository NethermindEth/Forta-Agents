import { HandleBlock, BlockEvent, Finding } from 'forta-agent';
import Web3 from 'web3';
import {
  checkOSMContracts,
  decodeNumber,
  createOSMPriceFinding,
} from './utils';

// The Handler that checks if OSM contract are returning Price of 0
const provideOSMPriceHandler = (
  web3: Web3,
  contracts: string[]
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    let findings: Finding[] = [];
    const promises: any = [];

    contracts.forEach((contract) => {
      promises.push(
        checkOSMContracts(web3, contract, blockEvent.blockNumber).then(
          (res) => {
            return {
              contract: contract,
              peek: res,
            };
          }
        )
      );
    });

    const res = await Promise.all(promises);

    res.forEach((res: any) => {
      const value = decodeNumber(web3, res.peek[0]).toString();
      const isValid = res.peek[1];

      if (value === '0' && !isValid) {
        findings.push(createOSMPriceFinding(res.contract, value.toString()));
      }
    });

    return findings;
  };
};

export default provideOSMPriceHandler;
