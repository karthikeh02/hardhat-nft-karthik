const { network, ethers } = require("hardhat")
const { assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT unit test", function () {
          let basicNft, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"])
              basicNft = await ethers.getContract("BasicNft")
          })

          describe("Constructor", () => {
              it("initializes the nft correctly", async () => {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })
          describe("MINT Nft", () => {
              beforeEach(async () => {
                  const txResponse = await basicNft.mintNft()
                  await txResponse.wait(1)
              })
              it("Allows user to mint an Nft, and updates appropriately", async function () {
                  const tokenURI = await basicNft.tokenURI(0)
                  const tokenCounter = await basicNft.getTokenCounter()

                  assert.equal(tokenCounter.toString(), "1")
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })
              it("it shows the correct balance and owner of nft", async function () {
                  const deployerAddress = deployer.address
                  const owner = await basicNft.ownerOf(0)
                  const deployerBalance = await basicNft.balanceOf(deployerAddress)

                  assert.equal(deployerBalance.toString(), "1")
                  assert.equal(deployerAddress, owner)
              })
          })
      })
