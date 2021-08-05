const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");
const {
    deployments
} = require("hardhat");

describe("CoinFlip contract: ", function () {
    let coinFlip, accounts;
    before("Before: ", async () => {
        accounts = await ethers.getNamedSigners()

        tx = await deployments.deploy("CoinFlip", {
            from: accounts.deployer.address,
            log: false,
        });

        coinFlip = await ethers.getContract("CoinFlip");
    })

    describe("Initialization...", async () => {
        it("Should initialize contract with correct values: ", async () => {
            expect(await coinFlip.WIN_COEFFICIENT()).to.equal(195);
            expect(await coinFlip.minEtherBet()).to.equal(ethers.utils.parseEther("0.1"));
            expect(await coinFlip.maxEtherBet()).to.equal(ethers.utils.parseEther("10"));
            // expect(await coinFlip.WIN_COEFFICIENT()).to.equal(195);
        })
    })
    describe("Balance: ", async () => {
        it("Should retrun balance of contract", async () => {
            k = await coinFlip.connect(accounts.caller).balanceContract()
            console.log(k.toString());
        })
    })
    describe("Function play: ", async () => {
        it('Choice should be 0 or 1', async () => {
            const seed = ethers.utils.formatBytes32String("game1");
            await accounts.deployer.sendTransaction({ value: ethers.utils.parseEther("0.2"), to: coinFlip.address })
            await expect(coinFlip.connect(accounts.caller).play(2, seed, { value: ethers.utils.parseEther("0.2") }))
                .to.be.revertedWith('Choice should be 0 or 1');
        })
        it("Should revert with msg Seed already used", async () => {
            const seed = ethers.utils.formatBytes32String("game1");
            await coinFlip.connect(accounts.caller).play(1, seed, { value: ethers.utils.parseEther("0.2") })
            await expect(coinFlip.connect(accounts.caller).play(1, seed, { value: ethers.utils.parseEther("0.2") }))
                .to
                .be
                .revertedWith('Seed already used')
        })
        it("Should revert with msg Rate is not between min and max bet", async () => {
            const seed = ethers.utils.formatBytes32String("game2");
            await expect(coinFlip.connect(accounts.caller).play(1, seed, { value: ethers.utils.parseEther("15") }))
                .to
                .be
                .revertedWith('Rate is not between min and max bet')
        })
        it("Should revert with msg Insufficent funds on contract to cover the bet", async () => {
            const seed = ethers.utils.formatBytes32String("game3");
            await expect(coinFlip.connect(accounts.caller).play(1, seed, { value: ethers.utils.parseEther("7") }))
                .to
                .be
                .revertedWith('Insufficent funds on contract to cover the bet')
        })

        it("Should Add new game with correct values", async () => {
            const betAmount = ethers.utils.parseEther("0.2");
            const houseProfitEther = await coinFlip.houseProfitEther();
            const choice = ethers.constants.One;
            const totalGamesCount = await coinFlip.totalGamesCount();
            const seed = ethers.utils.formatBytes32String("game4");
            await accounts.deployer.sendTransaction({ value: betAmount, to: coinFlip.address })
            await coinFlip.connect(accounts.caller).play(choice, seed, {
                value: ethers.utils.parseEther("0.2")
            });
            expect(await coinFlip.totalGamesCount()).to.equal(totalGamesCount.add(1))
            expect(await coinFlip.houseProfitEther()).to.equal(houseProfitEther.add(betAmount))
            expect(await coinFlip.games(seed)).to.be.deep.equal([//xi klor pakagic?
                totalGamesCount.add(1),
                accounts.caller.address,
                betAmount,
                ethers.constants.Zero,
                choice,
                ethers.constants.Zero,
                0
            ])
            expect(await coinFlip.listGames(totalGamesCount)).to.be.equal(seed);
        })
        it("Should throw event GamePlayed with correct ", async () => {
            const betAmount = ethers.utils.parseEther("0.2");
            const houseProfitEther = await coinFlip.houseProfitEther();
            const choice = ethers.constants.One;
            const totalGamesCount = await coinFlip.totalGamesCount();
            const seed = ethers.utils.formatBytes32String("game5");
            await accounts.deployer.sendTransaction({ value: betAmount, to: coinFlip.address })

            expect(await coinFlip.connect(accounts.caller).play(choice, seed, {
                value: betAmount
            }))
                .to.emit(coinFlip, 'GameCreated')
                .withArgs(accounts.caller.address, betAmount, 1, seed);
        })

    })
    describe("Confirm: ", async () => {
        it("Should reverted with msg Only the croupier can run this function.", async () => {
            await expect(
                coinFlip.connect(accounts.caller)
                    .confirm("0x6d6168616d000000000000000000000000000000000000000000000000000000", 1, "0x5d4168616d000000000000000000000000000000000000000000000000000000", "0x6d6168616d000000000000000000000000000000000000000000000000000000",))
                .to
                .be
                .revertedWith('Only the croupier can run this function.')
        })
        /*it("", async () => {
            const gamess = coinFlip.games("0x6d6168616d000000000000000000000000000000000000000000000000000000")
            await games.state() 
        })*/
    })
    describe("setBetRange: ", async () => {
        it("Should change minBet and maxBet values", async () => {
            await coinFlip.setBetRange(1, 20);
            expect(await coinFlip.maxEtherBet()).to.equal(20);
            expect(await coinFlip.minEtherBet()).to.equal(1);
        })
    })
    describe("setWinCoefficient: ", async () => {
        it("Should change coeficient", async () => {
            await coinFlip.setWinCoefficient(190);
            expect(await coinFlip.WIN_COEFFICIENT()).to.equal(190);
        })
    })
    describe("takeProfit: ", async () => {
        it("Should revert with msg Only the profit taker can run this function.", async () => {
            await expect(coinFlip.connect(accounts.caller).takeProfit())
                .to
                .be
                .revertedWith("Only the profit taker can run this function.")
        })
        it("Should take profit to ProfitTaker", async () => {
            profit = coinFlip.houseProfitEther();

        })
    })
    describe("setCroupier: ", async () => {
        it("Should change croupier", async () => {
            await coinFlip.setCroupier(accounts.caller.address);
            expect(await coinFlip.croupier())
                .to.equal(accounts.caller.address)
        })

    })
    describe("setProfitTaker", async () => {
        it("Should change profit taker", async () => {
            await coinFlip.setProfitTaker(accounts.caller.address)
            expect(await coinFlip.profitTaker()).to.equal(accounts.caller.address)
        })
    })

})