export class MemoryData {
  readonly size: number;
  private data: Record<string, Record<string, number[]>>;

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
    if(!this.data[keeper])
      this.data[keeper] = {};
    if(!this.data[keeper][strat])
      this.data[keeper][strat] = [timestamp];
    else {
      const list: number[] = this.data[keeper][strat];
      list.push(timestamp);
      if(list.length > this.size)
        list.splice(0, 1);
    }
    
    const list: number[] = this.get(keeper, strat);
    if(list.length < this.size)
      return -1;
    return list[this.size - 1] - list[0];
  }

  public get(
    keeper: string, 
    strat: string, 
  ): number[] {
    if(!this.data[keeper]) return [];
    if(!this.data[keeper][strat]) return [];
    return this.data[keeper][strat];
  }

  // Clears the data relative to a keeper/strategy pair.
  public removeStrategy(
    keeper: string, 
    strat: string,
  ) {
    if(this.data[keeper])
      delete this.data[keeper][strat];
  }
};

export class MemoryManager {
  private performMemory: MemoryData;
  private addStratMemory: MemoryData;

  constructor(size: number) {
    this.performMemory = new MemoryData(size);
    this.addStratMemory = new MemoryData(1);
  }

  public update(
    keeper: string, 
    strat: string, 
    timestamp: number,
  ): number {
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
    this.performMemory.removeStrategy(keeper, strat);
    this.addStratMemory.removeStrategy(keeper, strat);
  }
};
