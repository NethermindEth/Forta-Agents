import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { finding as Findings } from "./priceUpdateCheck";

export default class TimeTracking {
  functionWasCalled = false; // indicates if the function got called
  hour = 0; // keeps track of the hour

  // make sure hour gets updates and consequently status
  isNewHour(timestamp: number): boolean {
    return this.hour !== this.getHour(timestamp);
  }

  getHour(timestamp: number): number {
    const nd = new Date(timestamp * 1000);

    return nd.getUTCHours();
  }

  getMinute(timestamp: number): number {
    var d = new Date(timestamp * 1000); //x1000 to convert from seconds to milliseconds var s = d.toUTCString() s = s.substring(0,s.indexOf("GMT")) + "UTC" //change the confusing 'GMT' to 'UTC'
    return d.getUTCMinutes();
  }

  isInFirstTenMins(timestamp: number): boolean {
    const minutes = this.getMinute(timestamp);
    return minutes <= 10 ? true : false;
  }

  getFunctionCalledStatus(): boolean {
    return this.functionWasCalled;
  }

  setFunctionCalledStatus(status: boolean): void {
    this.functionWasCalled = status;
  }
}
