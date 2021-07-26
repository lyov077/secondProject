const { deployments } = require("hardhat");

module.exports = async function({getNamedAccounts,deployments})
{
    const{deploy} = deployments;
    const{deployer} = await getNamedAccounts()
    console.log("line 13 ~ deployer", deployer)

    await deploy('Greeter',{from: deployer,args:["hello"],log:true,})
}
    module.exports.tags = ["Greeter"]