export default class TimeTracking {
  hourStatus = false;
  hour = 0;

  // make sure hour gets updates and consequently status
  initialUpdate(): void {
    if (this.hour !== this.getHour() && this.getTime()) {
      this.hour = this.getHour();
      this.hourStatus = false;
    }
  }

  private getTimeObject(): Date {
    const date = new Date();
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset() * 60000;

    let utc = localOffset + localTime;
    const nd = new Date(utc);
    return nd;
  }

  getHour(): number {
    const nd = this.getTimeObject();
    return nd.getHours();
  }

  getMinute(): number {
    const nd = this.getTimeObject();
    return nd.getMinutes();
  }

  getTime(): boolean {
    const minutes = this.getMinute();
    return minutes <= 10 ? true : false;
  }

  getStatus(): boolean {
    return this.hourStatus;
  }

  setStatus(status: boolean): void {
    this.hourStatus = status;
  }
}
