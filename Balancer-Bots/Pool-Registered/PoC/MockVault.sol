pragma solidity ^0.7.0;

enum PoolSpecialization {
  GENERAL,
  MINIMAL_SWAP_INFO,
  TWO_TOKEN
}

contract MockVault {
    event PoolRegistered(bytes32 indexed poolId, address indexed poolAddress, PoolSpecialization specialization);

    function test() public {
        emit PoolRegistered("\x01", address(1), PoolSpecialization.GENERAL);
        emit PoolRegistered("\x02", address(2), PoolSpecialization.MINIMAL_SWAP_INFO);
        emit PoolRegistered("\x03", address(3), PoolSpecialization.TWO_TOKEN);
    }
}
