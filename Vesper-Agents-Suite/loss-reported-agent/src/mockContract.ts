import { createAddress } from "forta-agent-tools";

export const generateMockBuilder = () =>
  class mockContract {
    private addr: string;

    public methods = {
      poolAccountant: this.poolAccountant.bind(this),
    };

    constructor(_: any, address: string) {
      this.addr = address;
    }

    private poolAccountant() {
      return {
        call: () => this.addr,
      };
    }
  };
