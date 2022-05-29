// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;

import "https://github.com/umee-network/umee-v1-contracts/blob/39fe67d02905be7356053650d58241a02ffdcd12/contracts/protocol/tokenization/UToken.sol";

contract TestUToken is UToken {
    function testInitialize(
        address underlyingAsset,
        string calldata uTokenName,
        uint8 uTokenDecimals,
        string calldata uTokenSymbol
    ) external initializer {
        uint256 chainId;

        //solium-disable-next-line
        assembly {
            chainId := chainid()
        }

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(EIP712_DOMAIN, keccak256(bytes(uTokenName)), keccak256(EIP712_REVISION), chainId, address(this))
        );

        _setName(uTokenName);
        _setSymbol(uTokenSymbol);
        _setDecimals(uTokenDecimals);

        _underlyingAsset = underlyingAsset;
    }
}
