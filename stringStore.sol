// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract StringStore {
    string public store;

    function storeString(string calldata _s) public {
        store = _s;
    }
}