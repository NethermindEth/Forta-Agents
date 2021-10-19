class Pools {
  pool: Array<string> = [];

  insertPool(_pool: string): void {
    this.pool.push(_pool);
  }

  deletePool(_pool: string): void {
    const index = this.getIndexOf(_pool);
    if (index > -1) {
      this.pool.splice(index, 1);
    }
  }

  getIndexOf(_pool: string): number {
    return this.pool.indexOf(_pool);
  }
}

export default Pools;
