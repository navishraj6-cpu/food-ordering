const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Helper to calculate tier
const calculateTier = (lifetimePoints) => {
  if (lifetimePoints >= 3000) return "Platinum Royale";
  if (lifetimePoints >= 1500) return "Gold Connoisseur";
  if (lifetimePoints >= 500) return "Silver Epicure";
  return "Bronze Gourmand";
};

// Generate random prize for scratch card
const generateScratchPrize = () => {
  const prizes = [
    {
      title: "Gold Chest Discovery",
      prizeType: "points",
      prizeValue: 75,
      prizeName: "75 Foodie Gold Coins",
      promoCode: "",
    },
    {
      title: "Epicurean Cashback",
      prizeType: "points",
      prizeValue: 120,
      prizeName: "120 Foodie Gold Coins",
      promoCode: "",
    },
    {
      title: "Chef's Special Coupon",
      prizeType: "coupon",
      prizeValue: 50,
      prizeName: "₹50 OFF on orders above ₹299",
      promoCode: "SCRATCH50",
    },
    {
      title: "Artisan Dessert Voucher",
      prizeType: "dessert",
      prizeValue: 100,
      prizeName: "Free Artisan Dessert with any main dish",
      promoCode: "SWEETGOLD",
    },
    {
      title: "Royale Jackpot",
      prizeType: "points",
      prizeValue: 250,
      prizeName: "250 Foodie Gold Coins",
      promoCode: "",
    },
  ];
  return prizes[Math.floor(Math.random() * prizes.length)];
};

// @desc    Get user's loyalty profile
// @route   GET /api/loyalty/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize defaults if newly migrated
    let updated = false;
    if (user.loyaltyPoints === undefined || user.loyaltyPoints === null) {
      user.loyaltyPoints = 150;
      user.lifetimePointsEarned = 150;
      user.tier = "Bronze Gourmand";
      user.dailyStreak = { count: 1, lastClaimDate: null };
      updated = true;
    }

    if (!user.scratchCards || user.scratchCards.length === 0) {
      user.scratchCards = [
        {
          id: `sc_${Date.now()}_1`,
          title: "✨ Welcome Gold Scratch Card",
          prizeType: "points",
          prizeValue: 100,
          prizeName: "100 Foodie Gold Coins",
          promoCode: "",
          isClaimed: false,
          createdAt: new Date(),
        },
        {
          id: `sc_${Date.now()}_2`,
          title: "👑 Gourmet Mystery Card",
          prizeType: "coupon",
          prizeValue: 50,
          prizeName: "₹50 OFF Special Promo",
          promoCode: "GOLD50",
          isClaimed: false,
          createdAt: new Date(),
        },
      ];
      updated = true;
    }

    if (!user.pointsHistory || user.pointsHistory.length === 0) {
      user.pointsHistory = [
        {
          id: `ph_${Date.now()}_1`,
          type: "welcome_bonus",
          points: 150,
          description: "Welcome to Foodie VIP Rewards Lounge",
          createdAt: new Date(),
        },
      ];
      updated = true;
    }

    if (updated) {
      await user.save();
    }

    // Check if daily checkin is claimable today
    let canClaimDaily = true;
    if (user.dailyStreak?.lastClaimDate) {
      const last = new Date(user.dailyStreak.lastClaimDate);
      const today = new Date();
      if (
        last.getFullYear() === today.getFullYear() &&
        last.getMonth() === today.getMonth() &&
        last.getDate() === today.getDate()
      ) {
        canClaimDaily = false;
      }
    }

    res.json({
      loyaltyPoints: user.loyaltyPoints,
      lifetimePointsEarned: user.lifetimePointsEarned || user.loyaltyPoints,
      tier: user.tier || calculateTier(user.lifetimePointsEarned || user.loyaltyPoints),
      dailyStreak: user.dailyStreak || { count: 1, lastClaimDate: null },
      canClaimDaily,
      scratchCards: user.scratchCards || [],
      pointsHistory: (user.pointsHistory || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    });
  } catch (error) {
    console.error("Error fetching loyalty profile:", error);
    res.status(500).json({ message: "Server error fetching loyalty profile" });
  }
});

// @desc    Claim Daily Check-In streak bonus
// @route   POST /api/loyalty/daily-claim
// @access  Private
router.post("/daily-claim", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streakCount = user.dailyStreak?.count || 1;
    const lastClaim = user.dailyStreak?.lastClaimDate ? new Date(user.dailyStreak.lastClaimDate) : null;

    if (lastClaim) {
      lastClaim.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - lastClaim) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return res.status(400).json({ message: "Daily reward already claimed today. Come back tomorrow!" });
      } else if (diffDays === 1) {
        streakCount = (streakCount % 7) + 1;
      } else {
        streakCount = 1; // reset streak if missed a day
      }
    } else {
      streakCount = 1;
    }

    // Streak points table
    const streakPoints = [15, 20, 30, 40, 50, 75, 120];
    const pointsAwarded = streakPoints[streakCount - 1] || 25;

    user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsAwarded;
    user.lifetimePointsEarned = (user.lifetimePointsEarned || 0) + pointsAwarded;
    user.tier = calculateTier(user.lifetimePointsEarned);
    user.dailyStreak = {
      count: streakCount,
      lastClaimDate: new Date(),
    };

    user.pointsHistory.unshift({
      id: `ph_streak_${Date.now()}`,
      type: "daily_streak",
      points: pointsAwarded,
      description: `Day ${streakCount} Check-In Streak Reward`,
      createdAt: new Date(),
    });

    // If day 7 streak, award a bonus scratch card!
    let bonusScratchCard = null;
    if (streakCount === 7) {
      const prize = generateScratchPrize();
      bonusScratchCard = {
        id: `sc_streak7_${Date.now()}`,
        title: "👑 7-Day Streak Master Card",
        prizeType: prize.prizeType,
        prizeValue: prize.prizeValue,
        prizeName: prize.prizeName,
        promoCode: prize.promoCode,
        isClaimed: false,
        createdAt: new Date(),
      };
      user.scratchCards.unshift(bonusScratchCard);
    }

    await user.save();

    res.json({
      message: `Successfully claimed ${pointsAwarded} Foodie Gold Coins!`,
      pointsAwarded,
      streakCount,
      bonusScratchCard,
      loyaltyPoints: user.loyaltyPoints,
      tier: user.tier,
    });
  } catch (error) {
    console.error("Error in daily claim:", error);
    res.status(500).json({ message: "Server error claiming daily reward" });
  }
});

// @desc    Scratch and claim a scratch card
// @route   POST /api/loyalty/scratch/:id
// @access  Private
router.post("/scratch/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const card = user.scratchCards.find((c) => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Scratch card not found" });
    }

    if (card.isClaimed) {
      return res.status(400).json({ message: "This scratch card has already been claimed" });
    }

    card.isClaimed = true;

    if (card.prizeType === "points") {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + card.prizeValue;
      user.lifetimePointsEarned = (user.lifetimePointsEarned || 0) + card.prizeValue;
      user.tier = calculateTier(user.lifetimePointsEarned);

      user.pointsHistory.unshift({
        id: `ph_scratch_${Date.now()}`,
        type: "scratch_card",
        points: card.prizeValue,
        description: `Won from "${card.title}" Scratch Card`,
        createdAt: new Date(),
      });
    }

    await user.save();

    res.json({
      message: `🎉 You unlocked: ${card.prizeName}!`,
      card,
      loyaltyPoints: user.loyaltyPoints,
      tier: user.tier,
    });
  } catch (error) {
    console.error("Error scratching card:", error);
    res.status(500).json({ message: "Server error claiming scratch reward" });
  }
});

module.exports = router;
