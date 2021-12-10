import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  Log,
} from 'forta-agent';
import {
  ethers
} from 'ethers';
import { decodeParameter, decodeParameters, FindingGenerator, provideEventCheckerHandler } from 'forta-agent-tools';

export const CONTRACT_ADDRESS = "0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2"; //Voting Escrow contract
const abi = ["event Deposit(address,uint256,uint256,int128,uint256)"];
export const iface = new ethers.utils.Interface(abi); 

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) => {
    const {0:value} = decodeParameters(
      ['uint256', 'int128', 'uint256'],
      metadata!.data
    )
    return Finding.fromObject({
      name: "Lock creation on Voting Escrow contract Detected",
      description: "Deposit event with type 1 was emitted",
      alertId: alertID,
      severity: FindingSeverity.Low,
      type: FindingType.Suspicious,
      protocol: 'Curve Finance',
      metadata: {
        from: decodeParameter('address', metadata!.topics[1]),
        value: value,
        locktime: decodeParameter('int128', metadata!.topics[2]),
      }
      
    });
  };
};

export const provideCreateLockAgent = (
  alertID: string,
  address: string
): HandleTransaction => provideEventCheckerHandler(
      createFindingGenerator(alertID),
      iface.getEvent('Deposit').format('sighash'),
      address,
      // filter on event parameters
      (log: Log) => {
        const {1:type} = decodeParameters(
          ['uint256', 'int128', 'uint256'],
          log.data
        );
        return type ==='1';
      }
    );

export default {
  handleTransaction: provideCreateLockAgent(
    "CURVE-7",
    CONTRACT_ADDRESS
  )
};