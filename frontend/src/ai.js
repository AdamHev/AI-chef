export async function getRecipeFromChefClaude(ingredientsArr) {
  const apiUrl = import.meta.env.VITE_API_URL

  const response = await fetch(`${apiUrl}/api/recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ingredients: ingredientsArr })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData?.error || "Unknown error from backend")
  }

  const data = await response.json()
  return data.recipe
}
