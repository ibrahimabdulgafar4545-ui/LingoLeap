import User from '../models/User.js';
import { isFallbackMode, readJsonDb, writeJsonDb } from '../services/db.service.js';

const LEAGUES = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Diamond'];

// Helper to get promotion/demotion zones based on league size
const getZones = (leagueIndex, totalUsers) => {
  // Typical Duolingo: Top 10 promote, Bottom 10 demote
  const promoteCount = leagueIndex === LEAGUES.length - 1 ? 0 : 10; // Diamond has no promotion
  const demoteCount = leagueIndex === 0 ? 0 : 10; // Bronze has no demotion
  return { promoteCount, demoteCount };
};

export const getCurrentLeague = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    let users = [];
    let currentUser = null;

    if (!isFallbackMode()) {
      currentUser = await User.findById(userId);
      if (!currentUser) return res.status(404).json({ message: 'User not found' });

      // Get all users in the same league
      users = await User.find({ league: currentUser.league })
        .select('_id username avatarUrl weeklyXp targetLanguage level')
        .sort({ weeklyXp: -1 });
    } else {
      const db = readJsonDb();
      currentUser = db.users.find(u => u._id === userId);
      if (!currentUser) return res.status(404).json({ message: 'User not found' });
      
      users = db.users.filter(u => u.league === currentUser.league || (!u.league && currentUser.league === 'Bronze'))
        .map(u => ({
          _id: u._id,
          username: u.username,
          avatarUrl: u.avatarUrl,
          weeklyXp: u.weeklyXp || 0,
          targetLanguage: u.targetLanguage,
          level: u.level || 1
        }))
        .sort((a, b) => b.weeklyXp - a.weeklyXp);
    }

    const rankIndex = users.findIndex(u => u._id.toString() === userId);
    const currentRank = rankIndex !== -1 ? rankIndex + 1 : 0;
    
    const leagueIndex = LEAGUES.indexOf(currentUser.league || 'Bronze');
    const { promoteCount, demoteCount } = getZones(leagueIndex, users.length);

    res.json({
      league: currentUser.league || 'Bronze',
      users,
      currentRank,
      promoteCount,
      demoteCount,
      totalInLeague: users.length,
      weeklyXp: currentUser.weeklyXp || 0,
      weeklyXpStartedAt: currentUser.weeklyXpStartedAt
    });

  } catch (error) {
    console.error('Get League Error:', error);
    res.status(500).json({ message: 'Server error while fetching league' });
  }
};

export const getFriendsLeaderboard = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    let users = [];

    if (!isFallbackMode()) {
      const currentUser = await User.findById(userId).populate('friends', '_id username avatarUrl weeklyXp targetLanguage level');
      if (!currentUser) return res.status(404).json({ message: 'User not found' });

      users = [currentUser, ...currentUser.friends].map(u => ({
        _id: u._id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        weeklyXp: u.weeklyXp || 0,
        targetLanguage: u.targetLanguage,
        level: u.level
      }));
    } else {
      const db = readJsonDb();
      const currentUser = db.users.find(u => u._id === userId);
      if (!currentUser) return res.status(404).json({ message: 'User not found' });
      
      const friends = (currentUser.friends || []).map(fid => db.users.find(u => u._id === fid)).filter(Boolean);
      
      users = [currentUser, ...friends].map(u => ({
        _id: u._id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        weeklyXp: u.weeklyXp || 0,
        targetLanguage: u.targetLanguage,
        level: u.level || 1
      }));
    }

    users.sort((a, b) => b.weeklyXp - a.weeklyXp);
    const rankIndex = users.findIndex(u => u._id.toString() === userId);

    res.json({
      users,
      currentRank: rankIndex + 1
    });

  } catch (error) {
    console.error('Get Friends Leaderboard Error:', error);
    res.status(500).json({ message: 'Server error while fetching friends leaderboard' });
  }
};

export const processWeeklyReset = async (req, res) => {
  try {
    // Determine tournament rewards (top 3 get gems and badges)
    let processedUsers = 0;

    if (!isFallbackMode()) {
      const users = await User.find({});
      for (let u of users) {
        // Find their current league rank...
        // This is a simplified O(N^2) approach for mock purposes.
        const leagueUsers = await User.find({ league: u.league || 'Bronze' }).sort({ weeklyXp: -1 });
        const rank = leagueUsers.findIndex(lu => lu._id.toString() === u._id.toString()) + 1;
        const leagueIndex = LEAGUES.indexOf(u.league || 'Bronze');
        const { promoteCount, demoteCount } = getZones(leagueIndex, leagueUsers.length);
        
        let newLeagueIndex = leagueIndex;
        if (rank <= promoteCount && leagueIndex < LEAGUES.length - 1) {
          newLeagueIndex++; // Promote
        } else if (rank > leagueUsers.length - demoteCount && leagueIndex > 0) {
          newLeagueIndex--; // Demote
        }

        u.rankHistory = u.rankHistory || [];
        u.rankHistory.push({
          weekStart: u.weeklyXpStartedAt || Date.now(),
          rank,
          league: u.league || 'Bronze',
          xp: u.weeklyXp || 0
        });

        // Tournament rewards
        if (rank === 1) {
          u.gems = (u.gems || 0) + 100;
          u.tournamentRewards.push({ type: 'gems', amount: 100, reason: `1st Place in ${u.league} League` });
        } else if (rank === 2) {
          u.gems = (u.gems || 0) + 50;
          u.tournamentRewards.push({ type: 'gems', amount: 50, reason: `2nd Place in ${u.league} League` });
        } else if (rank === 3) {
          u.gems = (u.gems || 0) + 25;
          u.tournamentRewards.push({ type: 'gems', amount: 25, reason: `3rd Place in ${u.league} League` });
        }

        u.league = LEAGUES[newLeagueIndex];
        u.weeklyXp = 0;
        u.weeklyXpStartedAt = Date.now();
        await u.save();
        processedUsers++;
      }
    } else {
      const db = readJsonDb();
      for (let u of db.users) {
        const league = u.league || 'Bronze';
        const leagueUsers = db.users.filter(dbU => (dbU.league || 'Bronze') === league).sort((a, b) => (b.weeklyXp || 0) - (a.weeklyXp || 0));
        const rank = leagueUsers.findIndex(lu => lu._id === u._id) + 1;
        const leagueIndex = LEAGUES.indexOf(league);
        const { promoteCount, demoteCount } = getZones(leagueIndex, leagueUsers.length);
        
        let newLeagueIndex = leagueIndex;
        if (rank <= promoteCount && leagueIndex < LEAGUES.length - 1) {
          newLeagueIndex++;
        } else if (rank > leagueUsers.length - demoteCount && leagueIndex > 0) {
          newLeagueIndex--;
        }

        u.rankHistory = u.rankHistory || [];
        u.rankHistory.push({
          weekStart: u.weeklyXpStartedAt || new Date().toISOString(),
          rank,
          league,
          xp: u.weeklyXp || 0
        });

        if (rank === 1) {
          u.gems = (u.gems || 0) + 100;
          u.tournamentRewards = u.tournamentRewards || [];
          u.tournamentRewards.push({ type: 'gems', amount: 100, reason: `1st Place in ${league} League` });
        } else if (rank === 2) {
          u.gems = (u.gems || 0) + 50;
          u.tournamentRewards = u.tournamentRewards || [];
          u.tournamentRewards.push({ type: 'gems', amount: 50, reason: `2nd Place in ${league} League` });
        } else if (rank === 3) {
          u.gems = (u.gems || 0) + 25;
          u.tournamentRewards = u.tournamentRewards || [];
          u.tournamentRewards.push({ type: 'gems', amount: 25, reason: `3rd Place in ${league} League` });
        }

        u.league = LEAGUES[newLeagueIndex];
        u.weeklyXp = 0;
        u.weeklyXpStartedAt = new Date().toISOString();
        processedUsers++;
      }
      writeJsonDb(db);
    }

    res.json({ message: 'Weekly reset processed successfully', processedUsers });
  } catch (error) {
    console.error('Process Weekly Reset Error:', error);
    res.status(500).json({ message: 'Server error while processing weekly reset' });
  }
};
