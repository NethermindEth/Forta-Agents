import { BigNumber } from "ethers";

export default class DataWindow {
  private data: BigNumber[];
  private windowsSize: number;

  constructor(windowsSize: number) {
    this.windowsSize = windowsSize;
    this.data = [];
  }

  public addElement(element: BigNumber) {
    this.data.push(element);
    if (this.data.length > this.windowsSize) {
      this.data.splice(0, this.data.length - this.windowsSize);
    }
  }

  public getMean(): BigNumber {
    if (this.data.length === 0) {
      return BigNumber.from(0);
    }

    return this.data
      .reduce((x, y) => x.add(y), BigNumber.from(0))
      .div(this.data.length);
  }
}
