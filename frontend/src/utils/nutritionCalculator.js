// Comprehensive Nutrition & Macro Calculation Utility for Foodie Dishes

export const calculateDishNutrition = (food) => {
  if (!food) return { calories: 450, protein: 18, carbs: 42, fat: 16, fiber: 4, sodium: 620 };

  const name = (food.name || "").toLowerCase();
  const category = (food.category || "").toLowerCase();
  const type = (food.type || "").toLowerCase();
  const price = Number(food.price) || 250;

  // Base estimation algorithm based on dish type & category
  let calories = 380;
  let protein = 14;
  let carbs = 38;
  let fat = 14;
  let fiber = 3;
  let sodium = 480;

  if (category.includes("burger") || name.includes("burger")) {
    const isDouble = name.includes("double") || name.includes("triple") || name.includes("monster");
    const isBaconOrWagyu = name.includes("wagyu") || name.includes("bacon") || name.includes("truffle");
    calories = isDouble ? 780 : isBaconOrWagyu ? 680 : 540;
    protein = isDouble ? 46 : isBaconOrWagyu ? 38 : 28;
    carbs = 48;
    fat = isDouble ? 42 : isBaconOrWagyu ? 34 : 24;
    fiber = 4;
    sodium = 850;
  } else if (category.includes("pizza") || name.includes("pizza")) {
    calories = Math.round(price * 2.2 + 250);
    protein = Math.round(calories * 0.04);
    carbs = Math.round(calories * 0.11);
    fat = Math.round(calories * 0.038);
    fiber = 4;
    sodium = 920;
  } else if (category.includes("chicken") || name.includes("wings") || name.includes("tender") || name.includes("crispy")) {
    calories = 520;
    protein = 42;
    carbs = 18;
    fat = 26;
    fiber = 2;
    sodium = 740;
  } else if (category.includes("dessert") || name.includes("cake") || name.includes("brownie") || name.includes("sundae")) {
    calories = 420;
    protein = 6;
    carbs = 64;
    fat = 18;
    fiber = 3;
    sodium = 180;
  } else if (category.includes("drink") || category.includes("shake") || category.includes("beverage") || name.includes("shake")) {
    const isShake = name.includes("shake") || name.includes("smoothie") || category.includes("shake");
    calories = isShake ? 380 : 120;
    protein = isShake ? 9 : 1;
    carbs = isShake ? 54 : 28;
    fat = isShake ? 14 : 0;
    fiber = isShake ? 2 : 0;
    sodium = isShake ? 140 : 30;
  } else if (category.includes("salad") || name.includes("salad")) {
    calories = 260;
    protein = 12;
    carbs = 18;
    fat = 12;
    fiber = 7;
    sodium = 320;
  } else if (category.includes("pasta") || name.includes("pasta") || name.includes("lasagna")) {
    calories = 620;
    protein = 24;
    carbs = 72;
    fat = 22;
    fiber = 5;
    sodium = 680;
  }

  return { calories, protein, carbs, fat, fiber, sodium };
};

export const calculateCartMacros = (cartItems = []) => {
  return cartItems.reduce(
    (acc, item) => {
      const qty = item.quantity || 1;
      const nut = calculateDishNutrition(item.food);
      acc.calories += nut.calories * qty;
      acc.protein += nut.protein * qty;
      acc.carbs += nut.carbs * qty;
      acc.fat += nut.fat * qty;
      acc.fiber += nut.fiber * qty;
      acc.sodium += nut.sodium * qty;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );
};
