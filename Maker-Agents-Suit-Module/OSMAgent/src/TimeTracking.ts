import { Finding, FindingSeverity, FindingType } from "forta-agent";

export default class TimeTracking {
  hourStatus = false; // indicates if the function got called
  hour = 0; // keeps track of the hour

  // make sure hour gets updates and consequently status
  isNewHour(timestamp: number): any {
    let finding: Finding[] = [];
    if (this.hour !== this.getHour(timestamp)) {
      console.log("hours:", this.hour, this.getHour(timestamp), timestamp);
      this.hour = this.getHour(timestamp);

      // when the  previous hour never got called
      if (this.hourStatus === false) {
        finding.push(
          Finding.fromObject({
            name: "Method not called within the first 10 minutes",
            description:
              "Poke() function not called within 10 minutes of the hour",
            alertId: "MakerDAO-OSM-4",
            severity: FindingSeverity.Critical,
            type: FindingType.Unknown,
          })
        );
      } else {
        this.hourStatus = false;
        if (!this.isInFirstTenMins)
          finding.push(
            Finding.fromObject({
              name: "Method not called within the first 10 minutes",
              description:
                "Poke() function not called within 10 minutes of the hour",
              alertId: "MakerDAO-OSM-4",
              severity: FindingSeverity.Critical,
              type: FindingType.Unknown,
            })
          );
      }
    }
    return finding;
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
    console.log(minutes, timestamp);
    return minutes <= 10 ? true : false;
  }

  getFunctionCalledStatus(): boolean {
    return this.hourStatus;
  }

  setFunctionCalledStatus(status: boolean): void {
    this.hourStatus = status;
  }
}
