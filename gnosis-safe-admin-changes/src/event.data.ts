import { Finding } from 'forta-agent';
import { Log } from 'forta-agent/dist/sdk/receipt';

export interface EventHandler {
    (logs: string): Finding;
};

export interface EventData {
    signature: string,
    handler: EventHandler,
};
