import {
    Finding,
    FindingSeverity,
    FindingType,
    LogDescription,
} from "forta-agent";

type FindingGenerator = (log: LogDescription) => Finding;

const pause: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "CAKE Operations",
        description: "Pause event emitted",
        severity: FindingSeverity.High,
        type: FindingType.Info,
        alertId: "CAKE-9-1",
        metadata: {
            time: `${log.args["epoch"]}`,
        }
    });

const unpause: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "CAKE Operations",
        description: "Unpause event emitted",
        severity: FindingSeverity.High,
        type: FindingType.Info,
        alertId: "CAKE-9-2",
        metadata: {
            time: `${log.args["epoch"]}`,
        }
    });

const newOperatorAddress: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "CAKE Operations",
        description: "NewOperatorAddress event emitted",
        severity: FindingSeverity.Medium,
        type: FindingType.Info,
        alertId: "CAKE-9-3",
        metadata: {
            address: log.args["operator"].toLowerCase(),
        }
    });

const newAdminAddress: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "CAKE Operations",
        description: "NewAdminAddress event emitted",
        severity: FindingSeverity.Medium,
        type: FindingType.Info,
        alertId: "CAKE-9-4",
        metadata: {
            address: log.args["admin"].toLowerCase(),
        }
    });

const newOracle: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "CAKE Operations",
        description: "NewOracle event emitted",
        severity: FindingSeverity.Medium,
        type: FindingType.Info,
        alertId: "CAKE-9-5",
        metadata: {
            address: log.args["oracle"].toLowerCase(),
        }
    });

const newTreasuryFee: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "CAKE Operations",
        description: "NewTreasuryFee event emitted",
        severity: FindingSeverity.Medium,
        type: FindingType.Info,
        alertId: "CAKE-9-6",
        metadata: {
            time: `${log.args["epoch"]}`,
            fee: `${log.args["treasuryFee"]}`,
        }
    });



const functions: Record<string, FindingGenerator> = {
    "Pause": pause,
    "Unpause": unpause,
    "NewOperatorAddress": newOperatorAddress,
    "NewAdminAddress": newAdminAddress,
    "NewOracle": newOracle,
    "NewTreasuryFee": newTreasuryFee,
}

const resolver: FindingGenerator = (log: LogDescription) => functions[log.name](log);

export default {
    pause,
    unpause,
    newOperatorAddress,
    newAdminAddress,
    newOracle,
    newTreasuryFee,
    resolver,
};
