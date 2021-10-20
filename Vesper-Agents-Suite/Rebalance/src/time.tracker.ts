export default class TimeTracker{
    private data: Map<string, number>;

    constructor(){
        this.data = new Map<string, number>();
    }

    public tryGetLastTime(key: string): [boolean, number] {
        if(this.data.has(key))
            return [true, this.data.get(key) as number];
        return [false, -1];
    }

    public update(key: string, value: number): void {
        this.data.set(key, value);
    }

    public clear(): void {
        this.data = new Map<string, number>();
    }
};
