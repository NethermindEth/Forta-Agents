export default class TimeTracker {
  hour: number; // keeps track of the hour

  constructor() {
    this.hour = -1;
  }

  isDifferentHour(timestamp: number): boolean {
    return this.hour !== this.getHour(timestamp * 1000); //x1000 to convert from seconds to milliseconds 
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
    const minutes = this.getMinute(timestamp * 1000); //x1000 to convert from seconds to milliseconds 
    return minutes <= 10; 
  }

  updateHour(timestamp: number): void {
    this.hour = new Date(timestamp * 1000).getUTCHours(); //x1000 to convert from seconds to milliseconds 
  }
}
