pragma solidity ^0.7.0;

contract MockStablePool {
    string public name;

    constructor(string memory _name) {
        name = _name;
    }

    event AmpUpdateStarted(uint256 startValue, uint256 endValue, uint256 startTime, uint256 endTime);

    function updateAmp(uint256 startValue, uint256 endValue) public {
        emit AmpUpdateStarted(startValue, endValue, 0, 0);
    }
}

contract MockStablePoolGroup {
    MockStablePool[] internal _pools;

    constructor() {
        for (uint256 i = 0; i < 3; i++) {
            _pools.push(new MockStablePool("MockStablePool"));
        }
    }

    function getPools() public view returns (MockStablePool[] memory) {
        MockStablePool[] memory pools = new MockStablePool[](_pools.length);

        for (uint256 i = 0; i < _pools.length; i++) {
            pools[i] = _pools[i];
        }

        return pools;
    }

    function test() public {
        // considering:
        // - value threshold: 200
        // - decrease threshold: 100
        // - decrease percentage threshold: 20

        _pools[0].updateAmp(5000, 10000); // should emit no findings
        _pools[1].updateAmp(201, 200); // should emit a value threshold finding
        _pools[2].updateAmp(1000, 900); // should emit a decrease threshold finding
        _pools[0].updateAmp(400, 320); // should emit a decrease percentage threshold finding
        _pools[1].updateAmp(300, 200); // should emit all findings
    }
}
