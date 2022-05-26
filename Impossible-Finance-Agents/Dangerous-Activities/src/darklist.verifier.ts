import axios from "axios";

export const dataUrl: string =
  "https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/src/addresses/addresses-darklist.json";

const fetchMyEtherWalletDarklist = async (fetcher: any): Promise<[boolean, Set<string>]> => {
  try {
    const { data } = await fetcher(dataUrl);
    return [true, new Set<string>(data.map((addressInfo: Record<string, string>) => addressInfo["address"]))];
  } catch {
    return [false, new Set<string>()];
  }
};

export default class DarklistVerifier {
  readonly threshold: number;
  private darkset: Set<string>;
  private timestamp: number;
  private fetcher: any;

  constructor(threshold: number, fetcher: any = axios.get) {
    this.threshold = threshold;
    this.darkset = new Set<string>();
    this.timestamp = -1;
    this.fetcher = fetcher;
  }

  private async tryUpdate(timestamp: number) {
    if (this.timestamp === -1 || timestamp - this.timestamp > this.threshold) {
      const [ok, newDarkSet] = await fetchMyEtherWalletDarklist(this.fetcher);
      if (ok) {
        this.darkset = newDarkSet;
        this.timestamp = timestamp;
      }
    }
  }

  public async isDark(addr: string, timestamp: number = 0): Promise<boolean> {
    await this.tryUpdate(timestamp);
    return this.darkset.has(addr);
  }
}
