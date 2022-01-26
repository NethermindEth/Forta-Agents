import constants from "./constants";
import { MemoryData, MemoryManager } from "./memory";

describe("Memory tests suite", () => {
  describe("MemoryData", () => {
    it("should store the constructor parameters", () => {
      for(let i = 0; i < 10; ++i){
        const mem: MemoryData = new MemoryData(i);
  
        expect(mem.size).toStrictEqual(i);
      }
    });

    it("should store data correctly", () => {
      const mem: MemoryData = new MemoryData(3);
      const key1: string = "key1";
      const key2: string = "key2";
  
      const expected: number[] = [];
      for(let i = 0; i < 10; ++i){
        expected.push(i);
        mem.update(key1, key2, i);
        expect(mem.get(key1, key2)).toStrictEqual(
          expected.slice(Math.max(0, i - 2))
        );
      }
    });

    it("should return the correct time difference", () => {
      const mem: MemoryData = new MemoryData(5);
      const key1: string = "keyA";
      const key2: string = "keyZ";

      expect(mem.update(key1, key2, 1)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 2)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 3)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 4)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 5)).toStrictEqual(4);
      expect(mem.update(key1, key2, 7)).toStrictEqual(5);
      expect(mem.update(key1, key2, 9)).toStrictEqual(6);
      expect(mem.update(key1, key2, 11)).toStrictEqual(7);
      expect(mem.update(key1, key2, 13)).toStrictEqual(8);
    });

    it("should remove the data correctly", () => {
      const mem: MemoryData = new MemoryData(5);
  
      mem.update("AB", "CD", 20);
      expect(mem.get("AB", "CD")).toStrictEqual([20]);
      mem.removeStrategy("AB", "CD");
      expect(mem.get("AB", "CD")).toStrictEqual([]);
    });
  });

  describe("MemoryManager", () => {
    it("should store data correctly", () => {
      const mem: MemoryManager = new MemoryManager(3);
      const key1: string = "key1";
      const key2: string = "key2";
  
      for(let i = 0; i < 10; ++i){
        mem.update(key1, key2, i);
        expect(mem.getLast(key1, key2)).toStrictEqual(i);
      }
    });

    it("should return the correct time difference", () => {
      const mem: MemoryManager = new MemoryManager(5);
      const key1: string = "keyA2";
      const key2: string = "keyZ2";

      expect(mem.update(key1, key2, 0)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 1)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 2)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 3)).toStrictEqual(-1);
      expect(mem.update(key1, key2, 5)).toStrictEqual(5);
      expect(mem.update(key1, key2, 7)).toStrictEqual(6);
      expect(mem.update(key1, key2, 9)).toStrictEqual(7);
      expect(mem.update(key1, key2, 11)).toStrictEqual(8);
      expect(mem.update(key1, key2, 13)).toStrictEqual(8);
    });

    it("should addStrategy correctly", () => {
      const mem: MemoryManager = new MemoryManager(5);

      for(let i = 0; i < 10; ++i){
        const key1: string = i.toString();
        const key2: string = (i + 1).toString();

        mem.addStrategy(key1, key2, i);
        expect(mem.getLast(key1, key2)).toStrictEqual(i);
        mem.update(key1, key2, i + 1);
        expect(mem.getLast(key1, key2)).toStrictEqual(i + 1);
      }      
    });

    it("should remove the data correctly", () => {
      const mem: MemoryManager = new MemoryManager(10);
  
      mem.update("AB", "CD", 20);
      mem.addStrategy("AB", "CD", 12);
      mem.removeStrategy("AB", "CD", 0);
      expect(mem.getLast("AB", "CD")).toStrictEqual(-1);
    });

    it("should track daily events", () => {
      const mem: MemoryManager = new MemoryManager(2);
      const key1: string = "qwerty";
      const key2: string = "wasd";
  
      for(let i = 0; i < 10; ++i){
        mem.update(key1, key2, i);
        expect(mem.getCount(key1, key2)).toStrictEqual(i + 1);
      }
      for(let i = 0; i < 10; ++i){
        mem.update(key1, key2, i + constants.ONE_DAY + 1);
        expect(mem.getCount(key1, key2)).toStrictEqual(10);
      }
      mem.update(key1, key2, 6 + 2 * constants.ONE_DAY);
      expect(mem.getCount(key1, key2)).toStrictEqual(6);
    });
  });
});
