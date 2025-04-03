const apiUrl = import.meta.env.VITE_API_URL

export async function getRecipeFromChefClaude(ingredientsArr) {
  const response = await fetch(`${apiUrl}/api/recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ingredients: ingredientsArr })
  })

  const data = await response.json()
  return data.recipe
}
