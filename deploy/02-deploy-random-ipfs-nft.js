const { network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
// const { from } = require("solhint/lib/config")

const imageLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let tokenUris

    // get the IPFS hashes of our image
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    // 1. With our own IPFS node. https://docs.ipfs.io/
    // 2. Pinata
    // 3. Ntf.storage

    let vrfCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("-------------")
    await storeImages(imageLocation)
    const args = [
        networkConfig[chainId].vrfCoordinatorV2,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        // TokenUris
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("-------------")
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying....")
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris() {
    tokenUris = []
    // Store the Image in IPFS
    // Store the metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imageLocation)
    for (imageUploadResponsesIndex in imageUploadResponses) {
        // create the metadata
        // upload the metadata
        let tokenUriMetadata = { ...metadataTemplate }
        //
        tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
        console.log(`Uploading${tokenUriMetadata.name}...`)
        // Store the JSON to Pinata/Ipfs
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs Uploaded! They are:")
    console.log(tokenUris)

    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
