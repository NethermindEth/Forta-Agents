import { encode } from 'rlp';
import { keccak256 } from 'web3-utils';
import { AddressManager } from './utils';

export default class DeployedAddressesManager implements AddressManager {
  private nonce: number;
  private deployer: string;
  private deployedAddresses: Set<string>;
  private getNonce: any;

  public constructor(deployer: string, getNonce: any) {
    this.nonce = 0;
    this.deployer = deployer;
    this.getNonce = getNonce;
    this.deployedAddresses = new Set<string>();
  }

  public async update(block: string | number = "latest"): Promise<void> {
    const nonce: number = await this.getNonce(this.deployer, block);
    if(nonce > this.nonce){
      // Generate the contract addresses deployed by deployer associated with each one of the nonces
      for (let i: number = this.nonce + 1; i <= nonce; ++i) {
        const input_arr = [ this.deployer, i ];
        const rlp_encoded = encode(input_arr);
        const addr = "0x" + keccak256(rlp_encoded as any).slice(26);
        this.deployedAddresses.add(addr);
      }
      this.nonce = nonce;
    }
  }    

  public isDeployedAddress(addr: string): boolean{
    return this.deployedAddresses.has(addr);
  }

  public isKnownAddress(addr: string): boolean {
    return this.isDeployedAddress(addr);
  }
};
