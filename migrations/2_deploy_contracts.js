require('dotenv').config();
const PredMarketFactory = artifacts.require("PredMarketFactory.sol");

const { address: admin } = web3.eth.accounts.wallet.add(
    process.env.ADMIN_PK
);

const owner = process.env.OWNER;

//For Mainnet
// const wethPred = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
// const wbtcPred = "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6";

// const usdc = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

//For Mainnet
// const ethOracle = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
// const btcOracle = "0xc907E116054Ad103354f2D350FD2514433D57F6f";


//For Mumbai Testnet
const wethPred = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";
const ethOracle = "0x0715A7794a1dc8e42615F059dD6e406A6594651A";
const Token = "0xce746F6E5E99d9EE3457d1dcE5F69F4E27c12BD4";

module.exports = async function (deployer, _network) {
    
    if(_network === "mumbai"){
        await deployer.deploy(PredMarketFactory, owner, admin, admin);

        const predMarketFactory = await PredMarketFactory.deployed();
        
        //Deploy ETH prediction market with WETH as staking token
        await predMarketFactory.createMarket(
            "WETH/TKN",
            wethPred, 
            Token,
            ethOracle,
            [owner, admin, admin],
            60,
            120,
            30,
            web3.utils.toWei("1"),
            30
            );
        
        const ethMarketAdd = await predMarketFactory.markets(wethPred, Token);
        console.log("ETH prediction market deployed at address :" + ethMarketAdd);

        //Deploy BTC prediction market with WBTC as staking token
        // await predMarketFactory.createMarket(
        //     wbtcPred,
        //     usdc, 
        //     btcOracle,
        //     admin,
        //     admin,
        //     60,
        //     60,
        //     30,
        //     web3.utils.toWei("1"),
        //     30
        //     );
            
        // const btcMarketAdd = await predMarketFactory.markets(wbtcPred, wbtcStaked);
        // console.log("BTC prediction market deployed at address :" + btcMarketAdd);

    }
};
