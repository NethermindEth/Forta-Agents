import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

const getFloodModerator = (
  handler: HandleTransaction,
  shortPeriod: number,
  mediumPeriod: number,
) => {
  const lastAlert: Record<string, number> = {};

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = await handler(txEvent);
    const timestamp: number = txEvent.timestamp;

    const validFindings: Finding[] = [];
    for(let finding of findings){
      const keeper: string = finding.metadata.keeperAddress;
      const strat: string = finding.metadata.strategyAddress;
      const frame: string = finding.metadata.timeFrame;
      const key: string = `${keeper}-${strat}-${frame}`;
      let valid: boolean = false;
      
      if(!lastAlert[key])
        valid = true;
      else {
        const last: number = lastAlert[key];

        const frameNumber: number = Number(frame);
        switch(frameNumber){
          case shortPeriod:
          case mediumPeriod:
            valid = (timestamp - last > shortPeriod);
            break;
          default:
            valid = (timestamp - last > mediumPeriod);
        }
      }

      if(valid){
        validFindings.push(finding);
        lastAlert[key] = timestamp;
      }
    }

    return validFindings;
  };
};

export default getFloodModerator;