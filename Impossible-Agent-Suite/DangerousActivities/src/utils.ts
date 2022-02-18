export type Verifier = (addr: string) => boolean;

const listVerifier = (addrs: string[]): Verifier => {
  const set: Set<string> = new Set<string>(
    addrs.map(addr => addr.toLowerCase())
  );
  return (addr: string) => set.has(addr.toLowerCase());
};

export default {
  listVerifier,
};
