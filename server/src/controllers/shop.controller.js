import {
  findUserById,
  updateUser,
  getShopItems
} from '../services/db.service.js';

// @desc   Get shop items + current user's gem balance
// @route  GET /api/shop
export const getShop = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await findUserById(userId);
    const userGems = user?.gems ?? 50;
    const ownedItems = user?.ownedItems ?? [];
    const streakFreezes = user?.streakFreezes ?? 0;
    const items = await getShopItems();

    res.status(200).json({
      success: true,
      gems: userGems,
      streakFreezes,
      ownedItems,
      items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Purchase a shop item
// @route  POST /api/shop/buy
export const buyItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const items = await getShopItems();
    const item = items.find(i => i.itemId === itemId || i._id?.toString() === itemId || i.id === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in shop.' });
    }

    const userGems = user?.gems ?? 0;
    const ownedItems = user?.ownedItems ?? [];
    const ownedCount = ownedItems.filter(id => id === itemId).length;

    if (ownedCount >= item.maxOwnable) {
      return res.status(400).json({ success: false, message: `You already own the maximum amount of "${item.name}".` });
    }

    if (userGems < item.price) {
      return res.status(400).json({ success: false, message: `Not enough gems. You need ${item.price - userGems} more gems.` });
    }

    // Build update fields
    const updateFields = {
      gems: userGems - item.price,
      ownedItems: [...ownedItems, itemId]
    };

    // Special: streak freeze increments counter
    if (itemId === 'streak_freeze') {
      updateFields.streakFreezes = (user?.streakFreezes ?? 0) + 1;
    }

    // Special: heart refill restores current hearts to max!
    if (itemId === 'heart_refill') {
      const maxHeartsVal = user?.hearts?.max || 5;
      updateFields.hearts = {
        ...user.hearts,
        current: maxHeartsVal,
        lastRegeneratedAt: new Date()
      };
    }



    const updatedUser = await updateUser(userId, updateFields);

    res.status(200).json({
      success: true,
      message: `Successfully purchased "${item.name}"!`,
      gems: updatedUser.gems,
      streakFreezes: updatedUser.streakFreezes,
      ownedItems: updatedUser.ownedItems,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
