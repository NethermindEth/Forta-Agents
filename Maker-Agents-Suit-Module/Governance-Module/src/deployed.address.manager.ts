import { encode } from 'rlp';
import { keccak256 } from 'web3-utils';

export default class DeployedAddressManager {
  private nonce: number;
  private address: string;
  private deployedAddresses: {
    [key: string]: boolean,
  };
  private getNonce: any;

  public constructor(deployer: string, getNonce: any) {
    this.nonce = 0;
    this.address = deployer;
    this.deployedAddresses = {};
    this.getNonce = getNonce;
  }

  public async update(block: string | number = "latest"): Promise<void> {
    const nonce: number = await this.getNonce(this.address, block);
    if(nonce > this.nonce){
      for (let i: number = this.nonce + 1; i <= nonce; ++i) {
        const input_arr = [ this.address, i ];
        const rlp_encoded = encode(input_arr);
        const addr = "0x" + keccak256(rlp_encoded as any).slice(26);
        this.deployedAddresses[addr] = true;
      }
      this.nonce = nonce;
    }
  }    

  public isDeployedAddress(addr: string): boolean{
    return this.deployedAddresses[addr] !== undefined;
  }
};
