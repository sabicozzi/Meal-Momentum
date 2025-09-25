const axios = require('axios');

function calculateCalories({ gender, weight, height, age, activityLevel, goal }) {
  let bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMultiplier = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryActive:1.9 };
  let tdee = bmr * activityMultiplier[activityLevel];

  if(goal === 'lose') tdee -= 500;
  if(goal === 'gain') tdee += 500;

  return Math.round(tdee);
}

function calculateWaterIntake(weightKg, activityLevel) {
  let waterMl = weightKg * 35;
  const activityBonus = {sedentary:0, light:200, moderate:400, active:600, veryActive:800};
  waterMl += activityBonus[activityLevel] || 0;
  return Math.round(waterMl);
}

exports.generatePlan = async (req, res) => {
  const { age, gender, weight, height, activity, goal, dietPrefs } = req.body;
  const calories = calculateCalories({ age, gender, weight, height, activityLevel: activity, goal });
  const waterIntake = calculateWaterIntake(weight, activity);

  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
      params: { apiKey: process.env.SPOONACULAR_KEY, diet: dietPrefs.join(','), maxCalories: calories, number:7, addRecipeInformation:true }
    });

    const shoppingList = response.data.results.flatMap(recipe =>
      recipe.extendedIngredients.map(ing => ({ name: ing.name, amount: ing.amount, unit: ing.unit }))
    );

    res.json({ calories, waterIntake, recipes: response.data.results, shoppingList });
  } catch (error) {
    res.status(500).json({ message: "Error generating meal plan" });
  }
};
