export default class Memory {
  private curTime: number;
  readonly period: number;
  private lastClear: number;
  private data: Record<string, Record<string, [number, number]>>;

  constructor(period: number, ) {
    this.period = period;
    this.curTime = -1;
    this.data = {};
    this.lastClear = 0;
  }

  // Adds a new event associated with 
  // a keeper/strategy pair ocurred
  public update(
    keeper: string, 
    strat: string, 
    timestamp: number,
    value: number = 1,
  ) {
    if(!this.data[keeper])
      this.data[keeper] = {};
    if(!this.data[keeper][strat])
      this.data[keeper][strat] = [value, timestamp];
    else {
      let [count, time] = this.data[keeper][strat];
      if(time < this.lastClear) count = 0;
      this.data[keeper][strat] = [count + value, timestamp];
    }
  }

  private get(
    keeper: string, 
    strat: string, 
    time: boolean,
  ): number {
    if(!this.data[keeper]) return -1;
    if(!this.data[keeper][strat]) return -1;
    const [count, last] = this.data[keeper][strat];
    return time? last : count;
  }

  // Returns the amount of events registered associated with 
  // a keeper/strategy pair ocurred
  public getCount(
    keeper: string, 
    strat: string,
  ) {
    if(this.getLastTime(keeper, strat) < this.lastClear)
      return -1;
    return this.get(keeper, strat, false);
  }

  // Returns the last time when an event associated with 
  // a keeper/strategy pair ocurred
  public getLastTime(
    keeper: string, 
    strat: string,
  ) {
    return this.get(keeper, strat, true);
  }

  // Updates the last time registered for a keeper/strategy pair 
  // without modifiying the count. It represents the strategy addition
  // to the keeper.
  public addStrategy(
    keeper: string, 
    strat: string,
    timestamp: number,
  ) {
    // initValue 0 to avoid been counted
    this.update(keeper, strat, timestamp, 0);
  }

  // Clears the data realtive to a keeper/strategy pair.
  public removeStrategy(
    keeper: string, 
    strat: string,
    _: number,
  ) {
    if(this.data[keeper])
      delete this.data[keeper][strat];
  }

  // Checks is the period of time is already passed
  // and updates the actual time if the time is passed
  public isTimePassed(time: number): boolean {
    if(this.curTime == -1){
      this.curTime = time;
      return false;
    }
    if(time - this.period > this.curTime){
      this.curTime = time;
      return true;
    }
    return false;
  }

  // Clears will be executed on demand (lazy)
  // based on the time where the cleaning occured
  public clear(timestamp: number) {
    this.lastClear = timestamp;
  }
};
