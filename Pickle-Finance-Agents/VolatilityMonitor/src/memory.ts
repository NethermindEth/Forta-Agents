import constants from "./constants";

export class MemoryData {
  readonly size: number;
  private data: Record<string, number[]>;

  constructor(size: number) {
    this.size = size;
    this.data = {};
  }

  // Adds a new event associated with 
  // a keeper/strategy pair ocurred
  // Returns the time difference between the events if
  // the amount of events is reached
  public update(
    keeper: string, 
    strat: string, 
    timestamp: number,
  ): number {
    const key: string = `${keeper}-${strat}`;
    if(!this.data[key])
      this.data[key] = [timestamp];
    else {
      this.data[key].push(timestamp);
      if(this.data[key].length > this.size)
        this.data[key].splice(0, 1);
    }
    
    const list: number[] = this.data[key];
    if(list.length < this.size)
      return -1;
    return list[this.size - 1] - list[0];
  }

  public get(
    keeper: string, 
    strat: string, 
  ): number[] {
    const key: string = `${keeper}-${strat}`;
    if(!this.data[key]) return [];
    return this.data[key];
  }

  // Clears the data relative to a keeper/strategy pair.
  public removeStrategy(
    keeper: string, 
    strat: string,
  ) {
    const key: string = `${keeper}-${strat}`;
    delete this.data[key];
  }
};

export class MemoryManager {
  private performMemory: MemoryData;
  private addStratMemory: MemoryData;
  private dailyEvents: Record<string, number[]>;

  constructor(size: number) {
    this.performMemory = new MemoryData(size);
    this.addStratMemory = new MemoryData(1);
    this.dailyEvents = {};
  }

  public update(
    keeper: string, 
    strat: string, 
    timestamp: number,
  ): number {
    // update daily events
    const key: string = `${keeper}-${strat}`;
    if(!this.dailyEvents[key])
      this.dailyEvents[key] = [];
    const list: number[] = this.dailyEvents[key];
    list.push(timestamp);
    let count: number = 0;
    for(; count < list.length; ++count){
      if(timestamp - list[count] <= constants.ONE_DAY)
        break; 
    }    
    list.splice(0, count);

    return this.performMemory.update(keeper, strat, timestamp);
  }

  public getLast(
    keeper: string, 
    strat: string,
  ) {
    const perform: number[] = this.performMemory.get(keeper, strat);
    const add: number[] = this.addStratMemory.get(keeper, strat);
    return Math.max(
      perform.length == 0? -1 : perform[perform.length - 1],
      add.length == 0? -1 : add[add.length - 1],
    );
  }

  public addStrategy(
    keeper: string, 
    strat: string,
    timestamp: number,
  ) {
    this.addStratMemory.update(keeper, strat, timestamp);
  }

  public removeStrategy(
    keeper: string, 
    strat: string,
    _: number,
  ) {
    const key: string = `${keeper}-${strat}`;
    delete this.dailyEvents[key];
    this.performMemory.removeStrategy(keeper, strat);
    this.addStratMemory.removeStrategy(keeper, strat);
  }

  public getCount(
    keeper: string, 
    strat: string,
  ): number {
    const key: string = `${keeper}-${strat}`;
    if(!this.dailyEvents[key]) return 0;
    return this.dailyEvents[key].length;
  }
};
