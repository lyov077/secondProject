const {
    expect
} = require("chai");
const {
    ethers, web3
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

    describe("Function play: ", async () => {
        it('Choice should be 0 or 1', async () => {
            const seed = ethers.utils.formatBytes32String("game1");
            await accounts.deployer.sendTransaction({ value: ethers.utils.parseEther("0.2"), to: coinFlip.address })
            await expect(coinFlip.connect(accounts.caller).play(2, seed, { value: ethers.utils.parseEther("0.2") }))
                .to
                .be
                .revertedWith('Choice should be 0 or 1');
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

        it("Should revert with msg Seed already used", async () => {
            const seed = ethers.utils.formatBytes32String("game");
            await coinFlip.connect(accounts.caller).play(1, seed, { value: ethers.utils.parseEther("0.2") })//game1
            await expect(coinFlip.connect(accounts.caller).play(1, seed, { value: ethers.utils.parseEther("0.2") }))
                .to
                .be
                .revertedWith('Seed already used')
        })



        it("Should Add new game with correct values", async () => {
            const betAmount = ethers.utils.parseEther("0.2");
            const houseProfitEther = await coinFlip.houseProfitEther();
            const choice = ethers.constants.Zero;
            const totalGamesCount = await coinFlip.totalGamesCount();
            const seed = ethers.utils.formatBytes32String("game2");
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

        it("Should transfer bet Amount to CoinFLip contract: ", async () => {
            const betAmount = ethers.utils.parseEther("0.2");
            const choice = ethers.constants.One;
            const seed = ethers.utils.formatBytes32String("game6");
            await expect(() => coinFlip.connect(accounts.caller).play(choice, seed, { value: betAmount })).to.changeEtherBalances([accounts.caller, coinFlip], [betAmount.mul(ethers.constants.NegativeOne), betAmount]);
        })
    })
    describe("Confirm: ", async () => {
        it("Should reverted with msg Only the croupier can run this function.", async () => {
            const seed = ethers.utils.formatBytes32String("game2");
            const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            const signature = await web3.eth.accounts.sign(seed, privateKey)
            await expect(
                coinFlip.connect(accounts.caller)
                    .confirm(seed, signature.v, signature.r, signature.s))
                .to
                .be
                .revertedWith('Only the croupier can run this function.')
        })
        it("Should revert with msg,Game already played ", async () => {
            const seed = ethers.utils.formatBytes32String("game2");
            const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            const signature = await web3.eth.accounts.sign(seed, privateKey)

            await coinFlip.connect(accounts.deployer).confirm(seed, signature.v, signature.r, signature.s)

            await expect(coinFlip.connect(accounts.deployer).confirm(seed, signature.v, signature.r, signature.s))
                .to
                .be.revertedWith("Game already played")
        })
        it("Should revert with msg, Invalid signature", async () => {
            const seed = ethers.utils.formatBytes32String("game3");
            const privateKey = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e"
            const signature = await web3.eth.accounts.sign(seed, privateKey)
            await expect(coinFlip.connect(accounts.deployer).confirm(seed, signature.v, signature.r, signature.s))
                .to
                .be
                .revertedWith("Invalid signature")
        })

        it("Game result when you win", async () => {
            const seed = ethers.utils.formatBytes32String("game634536415");
            const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            const signature = await web3.eth.accounts.sign(seed, privateKey)
            const betAmount = ethers.utils.parseEther("0.2");
            const choice = ethers.constants.Zero;
            const winBet = 390000000000000000n
            await coinFlip.connect(accounts.caller).play(choice, seed, { value: betAmount })
            await expect(coinFlip.connect(accounts.deployer).confirm(seed, signature.v, signature.r, signature.s))
                .to
                .emit(coinFlip, 'GamePlayed')
                .withArgs(accounts.caller.address, betAmount, winBet, choice, 0, seed, 1);

            const k = await coinFlip.games(seed)
            expect(k[0]).to.equal(5);
            expect(k[1]).to.equal(accounts.caller.address);
            expect(k[2]).to.equal(betAmount);
            expect(k[3]).to.equal(winBet);
            expect(k[4]).to.equal(choice);
            expect(k[5]).to.equal(0);
            expect(k[6]).to.equal(1);



        })

        it("Game result when you lose", async () => {
            const seed = ethers.utils.formatBytes32String("game634");
            const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            const signature = await web3.eth.accounts.sign(seed, privateKey)
            const betAmount = ethers.utils.parseEther("0.2");
            const choice = ethers.constants.One;
            const winBet = 0
            await coinFlip.connect(accounts.caller).play(choice, seed, { value: betAmount })
            await expect(coinFlip.connect(accounts.deployer).confirm(seed, signature.v, signature.r, signature.s))
                .to
                .emit(coinFlip, 'GamePlayed')
                .withArgs(accounts.caller.address, betAmount, winBet, choice, 0, seed, 2);

            const a = await coinFlip.games(seed)

            expect(a[0]).to.equal(6);
            expect(a[1]).to.equal(accounts.caller.address);
            expect(a[2]).to.equal(betAmount);
            expect(a[3]).to.equal(winBet);
            expect(a[4]).to.equal(choice);
            expect(a[5]).to.equal(0);
            expect(a[6]).to.equal(2);
        })
    })

    describe("Function withdraw", async () => {
        it("Should withdraw balance of contract", async () => {
            const houseProfitEther = await coinFlip.houseProfitEther();
            const balanceContract = await ethers.provider.getBalance(coinFlip.address)//address contract
            await expect(await coinFlip.withdraw())
                .to
                .changeEtherBalances(
                    [coinFlip, accounts.deployer],
                    [(balanceContract.sub(houseProfitEther)).mul(ethers.constants.NegativeOne), balanceContract.sub(houseProfitEther)])
        })
    })
    describe("takeProfit: ", async () => {
        it("Should revert with msg Only the profit taker can run this function.", async () => {
            await expect(coinFlip.connect(accounts.caller).takeProfit())
                .to
                .be
                .revertedWith("Only the profit taker can run this function.")
        })
        it("Should transfer profit to ProfitTaker", async () => {
            const houseProfitEther = await coinFlip.houseProfitEther();

            await expect(await coinFlip.takeProfit())
                .to.changeEtherBalances([coinFlip, accounts.deployer], [houseProfitEther.mul(ethers.constants.NegativeOne), houseProfitEther])
        })
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