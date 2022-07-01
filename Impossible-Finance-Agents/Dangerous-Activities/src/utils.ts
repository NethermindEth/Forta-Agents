// Verifier receives all the info useful to verify an address
export type Verifier = (addr: string, timestamp: number, block: number) => boolean | Promise<boolean>;

const listVerifier = (addrs: string[]): Verifier => {
  const set: Set<string> = new Set<string>(addrs.map((addr) => addr.toLowerCase()));
  return (addr: string) => set.has(addr.toLowerCase());
};

export default {
  listVerifier,
};
