import Memory from "./memory";

describe("Memory tests suite", () => {
  it("should store the constructor parameters", () => {
    for(let i = 0; i < 10; ++i){
      const mem: Memory = new Memory(i);

      expect(mem.period).toStrictEqual(i);
    }
  });

  it("should store data correctly", () => {
    const mem: Memory = new Memory(3);
    const key1: string = "key1";
    const key2: string = "key2";

    for(let i = 0; i < 10; ++i){
      mem.update(key1, key2, i);
      expect(mem.getLastTime(key1, key2)).toStrictEqual(i);
      expect(mem.getCount(key1, key2)).toStrictEqual(i + 1);
    }
  });

  it("should return -1 when no records", () => {
    const mem: Memory = new Memory(0);
  
    expect(mem.getLastTime("a", "b")).toStrictEqual(-1);
    expect(mem.getCount("a", "b")).toStrictEqual(-1);
    mem.update("a", "c", 3);
    expect(mem.getLastTime("a", "b")).toStrictEqual(-1);
    expect(mem.getCount("a", "b")).toStrictEqual(-1);
  });

  it("should manage time correctly", () => {
    const mem: Memory = new Memory(10);
  
    expect(mem.isTimePassed(2)).toStrictEqual(false);
    expect(mem.isTimePassed(5)).toStrictEqual(false);
    expect(mem.isTimePassed(6)).toStrictEqual(false);
    expect(mem.isTimePassed(9)).toStrictEqual(false);
    expect(mem.isTimePassed(11)).toStrictEqual(false);
    expect(mem.isTimePassed(12)).toStrictEqual(true);
    expect(mem.isTimePassed(22)).toStrictEqual(true);
    expect(mem.isTimePassed(22)).toStrictEqual(false);
    expect(mem.isTimePassed(1)).toStrictEqual(false);
    expect(mem.isTimePassed(30)).toStrictEqual(false);
    expect(mem.isTimePassed(100)).toStrictEqual(true);
  });

  it("should not count addStrategy calls", () => {
    const mem: Memory = new Memory(1);

    mem.addStrategy("AB", "CD", 20);
    expect(mem.getCount("AB", "CD")).toStrictEqual(0);
    expect(mem.getLastTime("AB", "CD")).toStrictEqual(20);
  });

  it("should clear the data", () => {
    const mem: Memory = new Memory(1);

    mem.update("AB", "CD", 20);
    expect(mem.getCount("AB", "CD")).toStrictEqual(1);
    expect(mem.getLastTime("AB", "CD")).toStrictEqual(20);
    mem.clear();
    expect(mem.getCount("AB", "CD")).toStrictEqual(-1);
    expect(mem.getLastTime("AB", "CD")).toStrictEqual(-1);
  });
});
