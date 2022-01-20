export default class Memory {
  private curTime: number;
  readonly period: number;
  private data: Record<string, Record<string, [number, number]>>;

  constructor(period: number) {
    this.period = period;
    this.curTime = -1;
    this.data = {};
  }

  public update(
    keeper: string, 
    strat: string, 
    timestamp: number,
    initValue: number = 1,
  ) {
    if(!this.data[keeper])
      this.data[keeper] = {};
    if(!this.data[keeper][strat])
      this.data[keeper][strat] = [initValue, timestamp];
    else {
      const [count, _] = this.data[keeper][strat];
      this.data[keeper][strat] = [count + 1, timestamp];
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

  public getCount(
    keeper: string, 
    strat: string,
  ) {
    return this.get(keeper, strat, false);
  }

  public getLastTime(
    keeper: string, 
    strat: string,
  ) {
    return this.get(keeper, strat, true);
  }

  public addStrategy(
    keeper: string, 
    strat: string,
    timestamp: number,
  ) {
    // initValue 0 to avoid been counted
    this.update(keeper, strat, timestamp, 0);
  }

  public removeStrategy(
    keeper: string, 
    strat: string,
    _: number,
  ) {
    if(this.data[keeper])
      delete this.data[keeper][strat];
  }

  public isTimePassed(time: number): boolean {
    if(this.curTime == -1){
      this.curTime = time;
      return false;
    }
    if(time - this.period >= this.curTime){
      this.curTime = time;
      return true;
    }
    return false;
  }

  public clear() {
    this.data = {};
  }
};
