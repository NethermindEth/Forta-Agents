const callSchedule = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "bytes32",
      name: "id",
      type: "bytes32"
    },
    {
      indexed: true,
      internalType: "uint256",
      name: "index",
      type: "uint256"
    },
    {
      indexed: false,
      internalType: "address",
      name: "target",
      type: "address"
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "value",
      type: "uint256"
    },
    {
      indexed: false,
      internalType: "bytes",
      name: "data",
      type: "bytes"
    },
    {
      indexed: false,
      internalType: "bytes32",
      name: "predecessor",
      type: "bytes32"
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "delay",
      type: "uint256"
    }
  ],
  name: "CallScheduled",
  type: "event"
};

const callExecuted = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "bytes32",
      name: "id",
      type: "bytes32"
    },
    {
      indexed: true,
      internalType: "uint256",
      name: "index",
      type: "uint256"
    },
    {
      indexed: false,
      internalType: "address",
      name: "target",
      type: "address"
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "value",
      type: "uint256"
    },
    {
      indexed: false,
      internalType: "bytes",
      name: "data",
      type: "bytes"
    }
  ],
  name: "CallExecuted",
  type: "event"
};

const cancelled = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "bytes32",
      name: "id",
      type: "bytes32"
    }
  ],
  name: "Cancelled",
  type: "event"
};

const MinDelayChange = {
  anonymous: false,
  inputs: [
    {
      indexed: false,
      internalType: "uint256",
      name: "oldDuration",
      type: "uint256"
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "newDuration",
      type: "uint256"
    }
  ],
  name: "MinDelayChange",
  type: "event"
};

export { callExecuted, callSchedule, MinDelayChange, cancelled };
