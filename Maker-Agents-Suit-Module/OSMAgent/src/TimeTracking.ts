import { Finding, FindingSeverity, FindingType } from "forta-agent";

export default class TimeTracking {
  hourStatus = false; // indicates if the function got called
  hour = 0; // keeps track of the hour

  // make sure hour gets updates and consequently status
  initialUpdate(timestamp: number): any {
    let finding: Finding[] = [];
    if (this.hour !== this.getHour(timestamp)) {
      this.hour = this.getHour(timestamp);
      if (this.hourStatus === false) {
        finding.push(
          Finding.fromObject({
            name: "Method not called within the first 10 minutes",
            description:
              "Poke() function not called within 10 minutes of the hour",
            alertId: "NETHFORTA-24",
            severity: FindingSeverity.Critical,
            type: FindingType.Unknown,
          })
        );
      } else {
        this.hourStatus = false;
      }
    }
    return finding;
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
