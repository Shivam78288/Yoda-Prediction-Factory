// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
import './PredMarket.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';


contract PredMarketFactory{
    using SafeERC20 for IERC20;

    address public owner;
    address public admin;
    address public operator;

    //tokensPred + tokenStaked => market contract
    mapping(address => mapping(address => address[])) public markets;

    event MarketCreated(
        address indexed tokenPred, 
        address indexed tokenStaked,
        address market
        );

    event SetOwner(address oldOwner, address newOwner);
    event SetAdmin(address oldAdmin, address newAdmin);
    event SetOperator(address oldOperator, address newOperator);



    constructor(
        address _ownerAddress,
        address _adminAddress,
        address _operatorAddress
    ) {
        owner = _ownerAddress;
        admin = _adminAddress;
        operator = _operatorAddress;
        emit SetOwner(address(0), _ownerAddress);
        emit SetAdmin(address(0), _adminAddress);
        emit SetOperator(address(0), _operatorAddress);
    }

    function createMarket(
        string memory _name,
        address _tokenPred,
        address _tokenStaked,
        address _oracle,
        address[] memory _ownerAdminOperator,
        uint256 _lockInterval,
        uint256 _closeInterval,
        uint256 _buffer,
        uint256 _minBetAmount,
        uint256 _oracleUpdateAllowance
    )
    external
    onlyAdminOrOperator
    {
        PredMarket pred = new PredMarket(
            _name,
            _tokenPred,
            _tokenStaked,
            _oracle,
            _ownerAdminOperator,
            _lockInterval,
            _closeInterval,
            _buffer,
            _minBetAmount,
            _oracleUpdateAllowance
        );

        markets[_tokenPred][_tokenStaked].push(address(pred));

        emit MarketCreated(_tokenPred, _tokenStaked, address(pred));

    }

    function _onlyOwner() internal view{
        require(owner == msg.sender, "Only owner function");
    }

    function _onlyOwnerOrAdmin() internal view{
        require(
            owner == msg.sender ||
            admin == msg.sender,
            "Only owner or admin function"
            );
    }

    function _onlyAdminOrOperator() internal view{
        require(
            admin == msg.sender ||
            operator == msg.sender,
            "Only admin or operator function"
            );
    }
    
    modifier onlyOwner{
        _onlyOwner();
        _;
    }
    
    modifier onlyOwnerOrAdmin{
        _onlyOwnerOrAdmin();
        _;
    }

    modifier onlyAdminOrOperator{
        _onlyAdminOrOperator();
        _;
    }

    function changeOwner(address _owner) external onlyOwner{
        require(_owner != address(0), "Zero address");
        require(owner != _owner, "Already owner");
        owner = _owner;
        emit SetOwner(msg.sender, owner);
    }

    function changeAdmin(address _admin) external onlyOwner{
        require(_admin != address(0), "Zero address");
        require(admin != _admin, "Already admin");
        address oldAdmin = admin;
        admin = _admin;
        emit SetAdmin(oldAdmin, admin);
    }

    function changeOperator(address _operator) external onlyOwnerOrAdmin{
        require(_operator != address(0), 'Zero address');
        require(operator != _operator, 'Already operator');
        address oldOperator = operator;
        operator = _operator;
        emit SetOperator(oldOperator, _operator);
    }

    //If someone accidently sends any token or native currency to this contract
    function withdrawAllTokens(address token) external onlyOwner{
        uint256 bal = IERC20(token).balanceOf(address(this));
        withdrawToken(token, bal);
    }

    
    function withdrawToken(address token, uint256 amount) public onlyOwner{
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal >= amount, "balanace of token in contract too low");
        IERC20(token).safeTransfer(owner, amount);
    }

    function withdrawAllNative() external onlyOwner{
        uint256 bal = address(this).balance;
        withdrawNative(bal);
    } 

    function withdrawNative(uint256 amount) public onlyOwner{
        uint256 bal = address(this).balance;
        require(bal >= amount, "balanace of native token in contract too low");
        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Failure in transfer");
    }
}