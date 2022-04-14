export default class AddressesFetcher {
  private endpoint: string;
  private lastTime: number;
  private pipAddresses: string[];
  private elapsedTime: number;
  private getter: any;

  constructor(endpoint: string, getter: any, elapsedTime: number){
    this.lastTime = -1;
    this.pipAddresses = [];
    this.endpoint = endpoint;
    this.getter = getter;
    this.elapsedTime = elapsedTime;
  }

  private async fetch(timestamp: number): Promise<void> {
    await this.getter.get(this.endpoint)
      .then((response: Record<string, string>) => {
        const addresses: string[] = [];
        for(let [key, address] of Object.entries(response.data)){
          if(key.startsWith('PIP_'))
            addresses.push(address.toLowerCase());
        }
        this.lastTime = timestamp;
        this.pipAddresses = addresses;
      })
      .catch((error: any) => {
        console.log("Failing to retrieve the addresses with error:", error);
      });
  }

  public async get(timestamp: number): Promise<string[]> {
    if(this.lastTime === -1 || (this.lastTime + this.elapsedTime <= timestamp))
      await this.fetch(timestamp)
    return this.pipAddresses;
  }
};
