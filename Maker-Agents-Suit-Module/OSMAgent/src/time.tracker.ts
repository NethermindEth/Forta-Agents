export default class TimeTracker {
  private hour: number; // keeps track of the hour
  private firstHour: number;
  functionWasCalled: boolean;
  findingReported: boolean;

  constructor() {
    this.hour = -1;
    this.firstHour = -1;
    this.functionWasCalled = false;
    this.findingReported = false;
  }

  isDifferentHour(timestamp: number): boolean {
    if (this.hour === -1) {
      return false;
    }
    return this.hour !== this.getHour(timestamp);
  }

  updateFunctionWasCalled(status: boolean): void {
    this.functionWasCalled = status;
  }

  updateFindingReport(status: boolean): void {
    this.findingReported = status;
  }

  getHour(timestamp: number): number {
    const nd = new Date(timestamp * 1000); //x1000 to convert from seconds to milliseconds
    return nd.getUTCHours();
  }

  getMinute(timestamp: number): number {
    var d = new Date(timestamp * 1000); //x1000 to convert from seconds to milliseconds
    return d.getUTCMinutes();
  }

  isInFirstTenMins(timestamp: number): boolean {
    const minutes = this.getMinute(timestamp);
    return minutes <= 10;
  }

  isFirstHour(timestamp: number): boolean {
    return this.firstHour === this.getHour(timestamp);
  }

  updateHour(timestamp: number): void {
    if (this.hour === -1) {
      this.firstHour = this.getHour(timestamp);
    }
    this.hour = this.getHour(timestamp);
  }
}
