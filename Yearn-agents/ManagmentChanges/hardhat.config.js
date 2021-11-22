dotenv = require("dotenv");

dotenv.config();

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.jsonRPC,
        blockNumber: 13602542,
      }
    }
  }
}
