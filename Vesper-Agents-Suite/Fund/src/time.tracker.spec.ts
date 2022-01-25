import { createAddress } from "forta-agent-tools";
import TimeTracker from "./time.tracker";

describe("TimeTracker tests suite", () => {
    let tracker: TimeTracker;

    beforeEach(() => {
        tracker = new TimeTracker();
    });

    it("should return false for untracked values", () => {
        let keys: string[] = [
            "address",
            "key",
            "ethereum",
            createAddress("0xdead"),
        ];
        for(let key of keys){
            const [success,] = tracker.tryGetLastTime(key);
            expect(success).toStrictEqual(false);
        }
    });

    it("should update the tracked times", () => {
        let keyValues: [string, number][] = [
            ["address", 1],
            ["key", 10],
            ["address", 3],
            [createAddress("0xcafe"), 20],
            ["ethereum", 1000],
            ["ethereum", 0],
        ]
        for(let [key, time] of keyValues){
            tracker.update(key, time);
            const [success, lastTime] = tracker.tryGetLastTime(key);
            expect(success).toStrictEqual(true);
            expect(lastTime).toStrictEqual(time);
        }
    });
});
