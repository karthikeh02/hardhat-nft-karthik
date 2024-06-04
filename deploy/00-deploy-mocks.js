const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // Premium is 0.25 LINK to call everytime
const GAS_PRICE_LINK = 1e9 // 1000000000 - calculated value based on the gas price of the chain

// ETH PRICE Increases up to $100000000, So the Gas would go UPPPPP!!!!!!
// Chainlink will pay up the nodes via gas price and it would go up to
// basically The Link token in chainlink is connected to gas price,
// so if it fluctuates it will go up or down

// In Another Words, Price of requests change based on the price of gas

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks..")
        //Deploy a mock VRFcoordinator...
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks Deployed!")
        log("----------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
