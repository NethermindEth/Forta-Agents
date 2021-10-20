export default class TimeTracker{
    private data: Map<string, number>;

    constructor(){
        this.data = new Map<string, number>();
    }

    public tryGetLastTime(key: string){
        if(this.data.has(key))
            return [true, this.data.get(key)];
        return [false, -1];
    }

    public update(key: string, value: number){
        this.data.set(key, value);
    }
};
