pragma solidity 0.8.6;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract ByMe is Ownable {
    int256 public houseProfit = 0;
    address payable profitTaker;

    address payable croupier;

    uint256 public minBet = 0.1 ether;

    uint256 public maxBet = 10 ether;

    uint256 public coefficient = 195;

    uint256 public gamesCount = 0;
    enum GameState {
        WIN,
        LOSE,
        PENDING
    }

    struct Game {
        uint256 id;
        address payable player;
        uint256 bet;
        uint256 prize;
        uint256 choice;
        uint256 result;
        GameState state;
    }
    mapping(bytes32 => Game) games;
    bytes32[] public listGames;
    event GameCreate(
        address indexed player,
        uint256 bet,
        uint256 choice,
        bytes32 seed
    );
    event GamePlayed(
        address indexed player,
        uint256 bet,
        uint256 choice,
        uint256 result,
        bytes32 seed,
        GameState state
    );

    constructor() {
        profitTaker = payable(msg.sender);
        croupier = payable(msg.sender);
    }

    modifier BetInRange() {
        require(
            msg.value <= maxBet && msg.value >= minBet,
            "Rate is not between min and max bet"
        );
        _;
    }

    modifier OnlyCroupier() {
        require(
            msg.sender == croupier,
            "Only the croupier can run this function."
        );
        _;
    }
    modifier OnlyProfitTaker() {
        require(
            msg.sender == profitTaker,
            "Only the profit taker can run this function."
        );
        _;
    }

    function Play(uint256 _choice, bytes32 _seed) public payable BetInRange {
        require(_choice == 0 || _choice == 1, "Choice should be 0 or 1");

        uint256 possiblePrize = (msg.value * coefficient) / 100;
        require(
            address(this).balance > possiblePrize,
            "Insufficent funds on contract to cover the bet"
        );

        Game storage game = games[_seed];

        gamesCount += 1;
        houseProfit += int256(game.bet);
        game.id = gamesCount;
        game.player = payable(msg.sender);
        game.bet = msg.value;
        game.choice = _choice;
        game.state = GameState.PENDING;
        listGames.push(_seed);
        emit GameCreate(msg.sender, msg.value, _choice, _seed);
    }

    function Confirm(
        bytes32 _seed,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public OnlyCroupier OnlyProfitTaker {
        Game storage game = games[_seed];
        game.result = uint256(_s) % 2;

        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, _seed));
        require(
            ecrecover(prefixedHash, _v, _r, _s) == croupier,
            "Invalid signature"
        );

        if (game.result == game.choice) {
            game.prize = (game.bet * coefficient) / 100;
            game.state = GameState.WIN;
            game.player.transfer(game.prize);
            houseProfit -= int256(game.bet);
        } else {
            game.state = GameState.LOSE;
            game.prize = 0;
        }
        emit GamePlayed(
            game.player,
            game.bet,
            game.choice,
            game.result,
            _seed,
            game.state
        );
    }

    function setBetRange(uint256 _max, uint256 _min) public onlyOwner {
        maxBet = _max;
        minBet = _min;
    }

    function setCoefficient(uint256 _coefficient) public onlyOwner {
        coefficient = _coefficient;
    }

    function setCroupier(address payable _croupier) public onlyOwner {
        croupier = _croupier;
    }

    function setProfitTaker(address payable _profitTaker) public onlyOwner {
        profitTaker = _profitTaker;
    }

    function takeProfit() public OnlyProfitTaker {
        if (houseProfit > 0) {
            profitTaker.transfer(uint256(houseProfit));
            houseProfit = 0;
        }
    }

    function withDraw() public onlyOwner {
        if (houseProfit > 0) {
            payable(owner()).transfer(
                address(this).balance - uint256(houseProfit)
            );
            return;
        }
        payable(owner()).transfer(address(this).balance);
    }
}
