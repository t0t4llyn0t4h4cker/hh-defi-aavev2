const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT, DISPLAY_AMOUNT } = require("../scripts/getWeth")

async function main() {
	// aave protocol treats everything as a ERC20
	console.log("Swapping for WETH, one moment please")
	await getWeth()
	const { deployer } = await getNamedAccounts()

	const lendingPoolContract = await getLendingPool(deployer)
	console.log(`LendingPool address at: ${lendingPoolContract.address}`)
	// deposit
	const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
	// approve
	console.log(
		`Approving address ${lendingPoolContract.address} for the amount #${DISPLAY_AMOUNT}, one moment please`
	)
	await approveErc20(wethTokenAddress, lendingPoolContract.address, AMOUNT, deployer)
	console.log("Preparing to deposit..")
	await lendingPoolContract.deposit(wethTokenAddress, AMOUNT, deployer, 0)
	console.log("Deposit is confirmed")
}

async function getLendingPool(address) {
	const lendingPoolAddressProviderContract = await ethers.getContractAt(
		"ILendingPoolAddressesProvider",
		"0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
		address
	)
	const lendingPoolAddress = await lendingPoolAddressProviderContract.getLendingPool()
	const lendingPoolContract = await ethers.getContractAt(
		"ILendingPool",
		lendingPoolAddress,
		address
	)
	return lendingPoolContract
}

async function approveErc20(erc20address, spenderAddress, amountToSpend, address) {
	const erc20Token = await ethers.getContractAt("IERC20", erc20address, address)
	const tx = await erc20Token.approve(spenderAddress, amountToSpend)
	await tx.wait(1)
	console.log(`${spenderAddress} is approved to spend ${DISPLAY_AMOUNT}`)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
