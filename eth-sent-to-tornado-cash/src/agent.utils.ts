import { Finding, FindingSeverity, FindingType } from "forta-agent";


export const createFinding = (address: string): Finding => {
    return Finding.fromObject({
        alertId: "NETHFORTA-22",
        description: "Too much eth sent into Tornado from the same address in a short time interval",
        name: "Tornado Cash 1",
        severity: FindingSeverity.High,
        type: FindingType.Suspicious,
        metadata: {
            Address: address
        }
    });
}

export function isInArray<T> (array: T[], element: T): boolean {
    return array.filter( elem => elem === element).length > 0;
};