import {
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
    dataTypes: {type:string, name:string}[]
): FindingGenerator => {
    return (metadata: { [key: string]: any } | undefined) => {
        // NOTE: metadata from `pool.migration.ts`
        // does not have `data` key, has `traces` key
        // and `action` key inside of `traces`
        // *Yasmine note: decode the data using the format in dataTypes
        if (metadata?.data) {
            metadata = decodeParameters(
                dataTypes,
                metadata?.data
            )
        } /*else if (metadata?.to && metadata?.from && metadata?.input) {
            // NOTE: `else if` for pool.migration agent since it does not
            // have `data` key but `traces : { action : {...} }`
            // NOTE 02: Commented out because `pool.migration.ts` params
            // are being compared encoded to encoded in the test,
            // thus does not need to be decoded. (Should they be tested
            // before encoding to decoded?)
        } else {
            metadata = undefined
            // NOTE: Commented out above line because was setting
            // `pool.migration` metadata to undefined since it has
            // no `data` key.
        }*/


        // *Yasmine note: metadata contains additional inputs,
        // so we create filtredMetadata to only include the specified keys
        // NOTE: metadata from `pool.migration` does not have
        // additional keys
        let filtredMetadata = {};
        const paramsNumber = metadata?.__length__;

        let keys = [];
        metadata ? keys = Object.keys(metadata) : ''
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
  
        // NOTE: wrote this if/else because metadata from
        // 'pool.migration' is compared encoded to encoded
        // AND does not have additional irrelevant keys
        if (metadata?.__length__) {
            return createFinding(
                name,
                description,
                alertId,
                severity,
                type,
                filtredMetadata // *Yasmine note: return finding with the filtred metadata
            );
        } else {
            return createFinding(
                name,
                description,
                alertId,
                severity,
                type,
                metadata
            );
        }
    };
};

export default createFindingGenerator;