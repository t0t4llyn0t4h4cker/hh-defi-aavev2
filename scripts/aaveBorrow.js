const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth } = require("../scripts/getWeth")

async function main() {
	// aave protocol treats everything as a ERC20
	await getWeth()
	const { deployer } = await getNamedAccounts()

	const lendingPoolContract = await getLendingPool(deployer)
	console.log(`LendingPool address at: ${lendingPoolContract.address}`)
}

async function getLendingPool(deployer) {
	const lendingPoolAddressProviderContract = await ethers.getContractAt(
		"ILendingPoolAddressesProvider",
		"0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
		deployer
	)
	const lendingPoolAddress = await lendingPoolAddressProviderContract.getLendingPool()
	const lendingPoolContract = await ethers.getContractAt(
		"ILendingPool",
		lendingPoolAddress,
		deployer
	)
	return lendingPoolContract
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
