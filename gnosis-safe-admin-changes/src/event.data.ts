import { Finding } from "forta-agent";

export interface EventHandler {
  (logs: string): Finding;
}

export interface Event {
  signature: string;
  createFinding: EventHandler;
}
