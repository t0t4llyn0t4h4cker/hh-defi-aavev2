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
	let txDeposit = await lendingPoolContract.deposit(wethTokenAddress, AMOUNT, deployer, 0)
	txDeposit.wait(1)
	console.log("Deposit is confirmed")

	// need info such as how much we can borrow, collateral, and liquidationthreshold
	let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
		lendingPoolContract,
		deployer
	)
	// time to borrow
	// availableBorrowsEth conversation rate to DAI
	console.log("Checking DAI price in ETH, one moment please")
	const daiPrice = await getDaiPrice() // 18d
	//  amount of $DAI we can borrow from the $ETH we have deposited.
	const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
	// .95 to not hit health factor of 1
	console.log(`You can borrow ${amountDaiToBorrow} DAI`)
	const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString()) //parseEther is String to bigNumber
	// 18d so same as ether to wei

	const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
	await borrowDai(daiTokenAddress, lendingPoolContract, amountDaiToBorrowWei, deployer)
	await getBorrowUserData(lendingPoolContract, deployer)

	await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPoolContract, deployer)
	await getBorrowUserData(lendingPoolContract, deployer)
	// pay off reminder of DAI debt here
}

async function repay(amount, daiAddress, lendingPoolContract, account) {
	await approveErc20(daiAddress, lendingPoolContract.address, amount, account)
	const repayTx = await lendingPoolContract.repay(daiAddress, amount, 1, account)
	await repayTx.wait(1)
	console.log("Debt has been repaid!")
}

async function borrowDai(daiAddress, lendingPoolContract, amountDaiToBorrowWei, account) {
	console.log("Borrowing DAI, one moment please")
	const borrowTx = await lendingPoolContract.borrow(
		daiAddress,
		amountDaiToBorrowWei,
		1,
		0,
		account
	)
	await borrowTx.wait(1)
	console.log("You've borrowed DAI!")
}

async function getDaiPrice() {
	const daiEthPriceFeed = await ethers.getContractAt(
		"AggregatorV3Interface",
		"0x773616E4d11A78F511299002da57A0a94577F1f4"
	) // not connected to deployer account since not sending txs, only reading
	// const decimals = await daiEthPriceFeed.decimals()
	const price = (await daiEthPriceFeed.latestRoundData())[1] // store only our price/answer returned as 2 variable or 1 index

	console.log(`The DAI/ETH price is ${price.toString()}`)
	return price
}

async function getBorrowUserData(lendingPoolContract, address) {
	const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
		await lendingPoolContract.getUserAccountData(address)
	let viewColl = totalCollateralETH / 1e18
	let viewDebt = totalDebtETH / 1e18
	let viewBorrowETH = availableBorrowsETH / 1e18
	console.log(`You have ${totalCollateralETH} worth of ETH of deposited.`)
	console.log(`PRETTY You have ${viewColl.toString()} worth of ETH of deposited.`)
	console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
	console.log(`PRETTY You have ${viewDebt.toString()} worth of ETH borrowed.`)
	console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
	console.log(`PRETTY You can borrow ${viewBorrowETH.toString()} worth of ETH.`)

	return { availableBorrowsETH, totalDebtETH }
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
