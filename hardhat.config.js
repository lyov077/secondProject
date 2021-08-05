require("@nomiclabs/hardhat-waffle");
require('hardhat-deploy');
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy-ethers");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
const ALCHEMY_API_KEY = "xmG6DQHAlVE0st5IBPiAmcwk9_Fpdx16";
const PRIVATE_KEY = "0a9b85e19bec3560ea613b26ae6ddef8023c65f238615c976ccc5c2f4a69c889"
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.6",
  networks:{
    hardhat:{

    },
    rinkeby:{
      url:`https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  namedAccounts:{
    deployer:{
      default:0,
      "3": "0x1844e26c0CdF591c36FA3547CaDDaEee28a24405",
      "4": "0x1844e26c0CdF591c36FA3547CaDDaEee28a24405"
    },
    caller:{
      default:1,

    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "SGVVCC9QH1DY3WHSEX9U5F7TKXCC92RD2P"
  }
};

