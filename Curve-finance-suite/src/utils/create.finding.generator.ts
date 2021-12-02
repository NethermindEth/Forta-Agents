import {
    Finding,
    FindingSeverity,
    FindingType,
} from 'forta-agent';
import { FindingGenerator, decodeParameters } from 'forta-agent-tools';
import createFinding from "./create.finding";

const createFindingGenerator = (
    name: string,
    description: string,
    alertId: string,
    severity: FindingSeverity,
    type: FindingType,
    dataTypes: {type:string, name:string}[],
    
): FindingGenerator => {
    return (metadata: { [key: string]: any } | undefined) => {
        // decode the data using the format in dataTypes
        metadata?.data?
        metadata = decodeParameters(
           dataTypes,
            metadata?.data
          ): metadata = undefined


     // metadata contains additional inputs, so we create filtredMetadata to only include the specified keys
     let filtredMetadata = {};
     const paramsNumber = metadata?.__length__;
     let keys = [];
     metadata? keys= Object.keys( metadata):''
     const indexes = []; 
     for (let i = 0; i < paramsNumber; i++) {
       indexes.push(i.toString())
      }
      
     for (var key in metadata) {
        // filtrer to only get the keys specefied in dataTypes
        if(key!=='__length__' && !(key in indexes) )
        {
            Object.assign(filtredMetadata, { [key]: metadata[key] });
        }
    }
  
        return createFinding(
            name,
            description,
            alertId,
            severity,
            type,
            filtredMetadata // return finding with the filtred metadata
           
        );
    };
};

export default createFindingGenerator;