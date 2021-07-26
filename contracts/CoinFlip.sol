pragma solidity ^0.8.6;

contract CoinFlip {
    
    struct Game {
        uint256 id; //game id
        uint256 amount;
        uint256 possiblePrize;
        address player;
        bool choice;
    }
    uint256 gameCount;
    uint coificent;
    address owner;
    uint256 maxiBet;
    uint256 miniBet;
    mapping(uint256 => Game) public games;
    event GamePlayEvent(address indexed player,uint bet, uint possibleprize,uint gameid);
    constructor() {
        owner = msg.sender;
        uint256  maxiBet = 2 ether;
        uint256  miniBet = 1000000000000000 wei;
        uint256 coificent = 90;
    }
    modifier onlyOwner() {
        require(msg.sender != owner, "CoinFlip:Only owner can call");
        _;
    }
    
    modifier maxBet(){
        require(msg.value > maxiBet, "Maximum bet is smaller");
        _;
    }
    
    modifier minBet(){
        require(msg.value < miniBet, "Minimum bet is bigger" );
        _;
    }

    
    function Play(bool _choice) external payable maxBet minBet{
        require(msg.value > msg.sender.balance, "Not enough money in balance");
        games[gameCount] = Game(gameCount, msg.value, msg.value * coificent / 100, msg.sender,_choice);
        payable(address(this)).transfer(msg.value);
        gameCount += 1;
        emit GamePlayEvent(msg.sender, msg.value, msg.value * 90 /100,  gameCount);
    }
    
    function setValue(uint256 _maxBet, uint256 _minBet, uint256 _coificent) external onlyOwner{
        maxiBet = _maxBet;
        miniBet = _minBet;
        coificent = _coificent;
    }
    
    function Confirm(uint256 _id, bool _random) external onlyOwner{
        Game memory game = games[_id];
        if (game.choice == _random) {
            payable(msg.sender).transfer(game.possiblePrize);
        }

    }
}
