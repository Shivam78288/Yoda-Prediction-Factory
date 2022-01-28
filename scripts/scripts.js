require('dotenv').config();
const PredMarket = require('../build/contracts/PredMarket.json');
const Token = require('../build/contracts/Token.json');
const Web3 = require("web3");
const web3 = new Web3(
    new Web3.providers.WebsocketProvider(
        "wss://ws-matic-mumbai.chainstacklabs.com"
    )
);

const { address: admin } = web3.eth.accounts.wallet.add(
    process.env.ADMIN_PK
);

// console.log(admin)

const {address: player} = web3.eth.accounts.wallet.add(
    process.env.PLAYER_PK
);

// console.log(player)


const token = new web3.eth.Contract(
    Token.abi,
    "0xce746F6E5E99d9EE3457d1dcE5F69F4E27c12BD4"
);

// console.log(token.options.address);
const predMarket = new web3.eth.Contract(
    PredMarket.abi,
    "0x6D43a3c3aA351f7Df10699ED613a029c4E228036"
);

  
console.log('Started');

async function main() {
    
    const tokenBalAdmin = await token.methods.balanceOf(admin).call();
    console.log(`Admin token bal: ${web3.utils.fromWei(tokenBalAdmin)}`);

    const tokenBalPlayer = await token.methods.balanceOf(player).call();
    console.log(`Player token bal: ${web3.utils.fromWei(tokenBalPlayer)}`);

    await token.methods.approve(predMarket.options.address, tokenBalAdmin).send({
        from: admin,
        gasPrice: '10000000000',
        gas: 1000000
    });

    console.log(`Admin appoved`);

    await token.methods.approve(predMarket.options.address, tokenBalPlayer).send({
        from: player,
        gasPrice: '10000000000',
        gas: 1000000
    });

    console.log(`player approved`);

    // await predMarket.methods.pause().send({
    //     from: admin,
    //     gasPrice: '10000000000',
    //     gas: 1000000
    // });

    // console.log(`paused`);

    // await predMarket.methods.unpause().send({
    //     from: admin,
    //     gasPrice: '10000000000',
    //     gas: 1000000
    // });

    console.log(`unpaused`);

    let genStart = await predMarket.methods.genesisStartOnce().call();
    console.log("Genesis start round: " + genStart);
    const amount = web3.utils.toWei('1');

    if(!genStart){
        await predMarket.methods.genesisStartRound().send({
            from: admin,
            gasPrice: '10000000000',
            gas: 1000000
        });

        genStart = await predMarket.methods.genesisStartOnce().call();
        console.log("Genesis start round: " + genStart);
        
        await new Promise((resolve, _) => setTimeout(resolve, 60000)); 
        
        await predMarket.methods.genesisLockRound().send({
            from: admin,
            gasPrice: '10000000000',
            gas: 1000000
        });
        
        const genLock = await predMarket.methods.genesisLockOnce().call();
        console.log("Genesis lock round: " + genLock);
        
        await new Promise((resolve, _) => setTimeout(resolve, 60000)); 

        await predMarket.methods.executeRound().send({
            from: admin,
            gasPrice: '10000000000',
            gas: 1000000
        });

        const epoch = await predMarket.methods.currentEpoch().call();
        console.log(`Round ${epoch} started`);

        let round = await predMarket.methods.rounds(epoch).call();
        console.log(round);

        await predMarket.methods.betBull(amount).send({
            from: player,
            gasPrice: '10000000000',
            gas: 1000000
        });
        console.log(`Player bet bullish for ${web3.utils.fromWei(amount).toString()} tokens`)
        
        await predMarket.methods.betBear(amount).send({
            from:admin,
            gasPrice: '10000000000',
            gas: 1000000
        });
        console.log(`Admin bet bearish for ${web3.utils.fromWei(amount).toString()} tokens`);

        await new Promise((resolve, _) => setTimeout(resolve, 60000));
        
        console.log(`New round starting`);
        await predMarket.methods.executeRound().send({
            from: admin,
            gasPrice: '10000000000',
            gas: 1000000
        });

        console.log(`New round started`);
        
        await new Promise((resolve, _) => setTimeout(resolve, 60000));

        console.log(`New round starting`);
        await predMarket.methods.executeRound().send({
            from: admin,
            gasPrice: '10000000000',
            gas: 1000000
        });

        console.log(`New round started`);

        round = await predMarket.methods.rounds(epoch).call();
        console.log(`Round ${round.epoch}:\nOpen Price: ${round.openPrice}\nClose Price: ${round.closePrice}`);

        const claimableAdmin = await predMarket.methods.claimable(epoch, admin).call();
        console.log(`Claimable for admin: ${claimableAdmin}`);
        
        const refundableAdmin = await predMarket.methods.refundable(epoch, admin).call();
        console.log(`Refundable for admin: ${refundableAdmin}`);
        
        const claimablePlayer = await predMarket.methods.claimable(epoch, player).call();
        console.log(`Claimable for player: ${claimablePlayer}`);
        
        const refundablePlayer = await predMarket.methods.refundable(epoch, player).call();
        console.log(`Refundable for player: ${refundablePlayer}`);

        if(claimableAdmin){
            await predMarket.methods.claim(epoch).send({
                from: admin,
                gasPrice: '10000000000',
                gas: 1000000
            });
            predMarket.events.Claim().on('data', async event => {
                console.log(event);
                console.log(
                    `Claim Admin:\nClaimant: ${event.sender}\nAmount: ${event.amount}\nEpoch: ${event.currentEpoch}`
                );
            });   
        }

        else if(claimablePlayer){
            await predMarket.methods.claim(epoch).send({
                from: player,
                gasPrice: '10000000000',
                gas: 1000000
            });
            predMarket.events.Claim().on('data', async event => {
                console.log(event);
                console.log(
                    `Claim Player:\nClaimant: ${event.returnValues.sender}\nAmount: ${event.returnValues.amount}\nEpoch: ${event.returnValues.currentEpoch}`
                );
            }); 
        }

        if(refundableAdmin){
            await predMarket.methods.claim(epoch).send({
                from: admin,
                gasPrice: '10000000000',
                gas: 1000000
            });
            predMarket.events.Claim().on('data', async event => {
                console.log(event);
                console.log(
                    `Claim Admin:\nClaimant: ${event.returnValues.sender}\nAmount: ${event.returnValues.amount}\nEpoch: ${event.returnValues.currentEpoch}`
                );
            });   
        }

        if (refundablePlayer){
            await predMarket.methods.claim(epoch).send({
                from: player,
                gasPrice: '10000000000',
                gas: 1000000
            });
            predMarket.events.Claim().on('data', async event => {
                console.log(event);
                console.log(
                    `Claim Player:\nClaimant: ${event.returnValues.sender}\nAmount: ${event.returnValues.amount}\nEpoch: ${event.returnValues.currentEpoch}`
                );
            }); 
        }

        await predMarket.methods.claimTreasury().send({
            from: admin,
            gasPrice: '10000000000',
            gas: 1000000
        });
        
        predMarket.events.ClaimTreasury().on('data', async event => {
            console.log(event);
            console.log(
                `Claim Treasury:\nClaimant: ${admin}\nAmount: ${event.returnValues.amount}`
            )            
        });
    }
}

main();