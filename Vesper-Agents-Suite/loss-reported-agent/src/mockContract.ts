import { createAddress } from "forta-agent-tools";

export const generateMockBuilder = (p: string[]) => class mockContract {
  private addr: string;

  public methods = {
    pools: this.pools,
    length: this.length,     
    at: this.at,
    poolAccountant: this.poolAccountant.bind(this),
  };

  constructor(_: any, address: string) {
    this.addr = address;
    console.log(address);
  }

  private pools() {
    return {
      call: () => createAddress("0x0")
    }
  };

  private length() {
    return {
      call: () => "2"
    }
  };

  private at(index: number) {
    return {
      call: () => p[index] 
    }
  }
  
  private poolAccountant() {
      return {
        call: () => this.addr
      }
  }
};



