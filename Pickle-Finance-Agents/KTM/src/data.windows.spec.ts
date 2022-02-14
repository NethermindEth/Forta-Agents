import DataWindows from "./data.windows";
import { BigNumber } from "ethers";

describe("DataWindows Test Suite", () => {
  it("should correctly compute the mean with a number of elemnts below its capacity", () => {
    const dataWindows = new DataWindows(5);

    dataWindows.addElement(BigNumber.from(4));
    expect(dataWindows.getMean().toString()).toStrictEqual("4");

    dataWindows.addElement(BigNumber.from(8));
    expect(dataWindows.getMean().toString()).toStrictEqual("6");

    dataWindows.addElement(BigNumber.from(3));
    expect(dataWindows.getMean().toString()).toStrictEqual("5");

    dataWindows.addElement(BigNumber.from(10));
    expect(dataWindows.getMean().toString()).toStrictEqual("6");
  });

  it("should correctly compute the mean at its capacity", () => {
    const dataWindows = new DataWindows(5);

    dataWindows.addElement(BigNumber.from(4));
    dataWindows.addElement(BigNumber.from(8));
    dataWindows.addElement(BigNumber.from(3));
    dataWindows.addElement(BigNumber.from(10));
    dataWindows.addElement(BigNumber.from(0));

    expect(dataWindows.getMean().toString()).toStrictEqual("5");
  });

  it("should correctly compute the mean on the last `capacity` elements", () => {
    const dataWindows = new DataWindows(5);

    dataWindows.addElement(BigNumber.from(4));
    dataWindows.addElement(BigNumber.from(8));
    dataWindows.addElement(BigNumber.from(3));
    dataWindows.addElement(BigNumber.from(10));
    dataWindows.addElement(BigNumber.from(0));

    dataWindows.addElement(BigNumber.from(9));
    expect(dataWindows.getMean().toString()).toStrictEqual("6");

    dataWindows.addElement(BigNumber.from(3));
    expect(dataWindows.getMean().toString()).toStrictEqual("5");

    dataWindows.addElement(BigNumber.from(13));
    expect(dataWindows.getMean().toString()).toStrictEqual("7");
  });
});
