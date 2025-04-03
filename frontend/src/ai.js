export async function getRecipeFromChefClaude(ingredientsArr) {
    const response = await fetch("http://localhost:3001/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ingredientsArr }),
    })
  
    const data = await response.json()
    return data.recipe
  }
  