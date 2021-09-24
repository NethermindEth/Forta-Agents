export default class TimeTracking {
  hourStatus = false; // indicates if the function got called
  hour = 0; // keeps track of the hour

  // make sure hour gets updates and consequently status
  initialUpdate(timestamp: number): void {
    if (this.hour !== this.getHour(timestamp)) {
      this.hour = this.getHour(timestamp);
      this.hourStatus = false;
    }
  }

  getHour(timestamp: number): number {
    const nd = new Date(timestamp * 1000);
    return nd.getHours();
  }

  getMinute(timestamp: number): number {
    var d = new Date(timestamp * 1000); //x1000 to convert from seconds to milliseconds var s = d.toUTCString() s = s.substring(0,s.indexOf("GMT")) + "UTC" //change the confusing 'GMT' to 'UTC'
    return d.getMinutes();
  }

  getTime(timestamp: number): boolean {
    const minutes = this.getMinute(timestamp);
    return minutes <= 10 ? true : false;
  }

  getStatus(): boolean {
    return this.hourStatus;
  }

  setStatus(status: boolean): void {
    this.hourStatus = status;
  }
}
