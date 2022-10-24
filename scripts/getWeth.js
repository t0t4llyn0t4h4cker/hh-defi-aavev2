const { getNamedAccounts, ethers } = require("hardhat")
const AMOUNT = ethers.utils.parseEther("0.02") // constant to include in payable functions
const DISPLAY_AMOUNT = AMOUNT / 1e18

async function getWeth() {
	const { deployer } = await getNamedAccounts()
	// call deposit function on the weth contract
	// abi, contract address
	// 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
	const iWethContract = await ethers.getContractAt(
		"IWeth",
		"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		deployer
	)

	const tx = await iWethContract.deposit({ value: AMOUNT })
	await tx.wait(1)
	const wethBalance = await iWethContract.balanceOf(deployer)
	// console.log(`Got ${wethBalance.toString()} WETH`) // returns with 18 decimals place see parseEther
	console.log(`Swapped for ${DISPLAY_AMOUNT} WETH`) // returns .02
}

module.exports = { getWeth, AMOUNT, DISPLAY_AMOUNT }
