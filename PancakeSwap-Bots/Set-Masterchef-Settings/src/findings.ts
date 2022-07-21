import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

type FindingGenerator = (log: LogDescription) => Finding;

const setMigrator: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "MasterChef Settings",
        description: "setMigrator function invoked",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "PancakeSwap",
        alertId: "CAKE-5-1",
        metadata: {
            migratoraddr: log.args["_migrator"].toLowerCase(),
        },
    });

const dev: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "MasterChef Settings",
        description: "dev function invoked",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "PancakeSwap",
        alertId: "CAKE-5-2",
        metadata: {
            newdevaddr: log.args["_devaddr"].toLowerCase(),
        },
    });

const add: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "MasterChef Settings",
        description: "add function invoked",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "PancakeSwap",
        alertId: "CAKE-5-3",
        metadata: {
            allocPoint: log.args["_allocPoint"].toString(),
            lpToken: log.args["_lpToken"].toString(),
            withUpdate: log.args["_withUpdate"].toString(), 
        },
    });

const set: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "MasterChef Settings",
        description: "set function invoked",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "PancakeSwap",
        alertId: "CAKE-5-4",
        metadata: {
            pid: log.args["_pid"].toString(),
            allocPoint: log.args["_allocPoint"].toString(),
            withUpdate: log.args["_withUpdate"].toString(), 
        },
    });

const updateMultiplier: FindingGenerator = (log: LogDescription): Finding =>
    Finding.fromObject({
        name: "MasterChef Settings",
        description: "updateMultiplier function invoked",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "PancakeSwap",
        alertId: "CAKE-5-5",
        metadata: {
            multiplierNumber: log.args["multiplierNumber"].toString(),
        },
    });


const functions: Record<string, FindingGenerator> = {
    setMigrator: setMigrator,
    dev: dev,
    add: add,
    set: set,
    updateMultiplier: updateMultiplier,
};

const resolver: FindingGenerator = (log: LogDescription) => functions[log.name](log);

export default {
    resolver,
};