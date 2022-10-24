const { getWeth } = require("../scripts/getWeth")

async function main() {
	// aave protocol treats everything as a ERC20
	await getWeth()
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
