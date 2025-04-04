import React from "react"
import IngredientsList from "./components/IngredientsList"
import ClaudeRecipe from "./components/ClaudeRecipe"
import { getRecipeFromChefClaude } from "./ai"

export default function Main1() {
  const [ingredients, setIngredients] = React.useState([])
  const [recipe, setRecipe] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function getRecipe() {
    setLoading(true)
    setError("")
    setRecipe("")

    try {
      const recipeMarkdown = await getRecipeFromChefClaude(ingredients)
      setRecipe(recipeMarkdown)
    } catch (err) {
        console.error("💥 Caught error from Claude:", err)
        setError("🍳 Chef Claude took a nap. Try again in a moment.")
    } finally { 
      setLoading(false)
    }
  }

  function addIngredient(formData) {
    const newIngredient = formData.get("ingredient")
    setIngredients(prevIngredients => [...prevIngredients, newIngredient])
  }

  return (
    <main>
        <form action={addIngredient} className="add-ingredient-form">
            <input
            type="text"
            placeholder="e.g. potatoes"
            aria-label="Add ingredient"
            name="ingredient"
            />
            <button>Add ingredient</button>
        </form>

        {ingredients.length === 0 && (
            <div className="instructions">
                👋 Welcome! Tell Chef Claude what ingredients you have, and he’ll whip up a tasty recipe.
            </div>
        )}


        {ingredients.length > 0 && (
            <IngredientsList ingredients={ingredients} getRecipe={getRecipe} />
        )}

        {loading && (
            <div className="thinking">
                <div className="spinner" />
                <span>Chef Claude is thinking...</span>
            </div>
        )}

        {error && ( 
            <div className="error-message">
                🍳 {error}<br />
                <br />
                <button onClick={getRecipe}>🔁 Try Again</button>
            </div>
        )}

        {recipe && !error && <ClaudeRecipe recipe={recipe} />}
    </main>
  )
}
