import React from "react"
import IngredientsList from "./components/IngredientsList"
import ClaudeRecipe from "./components/ClaudeRecipe"
import { getRecipeFromChefClaude } from "./ai"

export default function Main1() {
  const [ingredients, setIngredients] = React.useState([]) // Initialize ingredients as an empty array
  const [recipe, setRecipe] = React.useState("") // Initialize recipe as an empty string
  const [loading, setLoading] = React.useState(false) // Initialize loading as false
  const [error, setError] = React.useState("")  // Initialize error as an empty string
  const recipeSection = React.useRef(null) // Create a ref for the recipe
  console.log(recipeSection)

  React.useEffect(() => {
    if ((recipe !== "" || error !== "") && recipeSection.current !== null) {
      recipeSection.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [recipe, error])

  async function getRecipe() {
    setLoading(true)
    setError("")
    setRecipe("")
    try {
      const recipeMarkdown = await getRecipeFromChefClaude(ingredients)
      setRecipe(recipeMarkdown)
    } catch (err) {
        console.error("💥 Caught error from Claude:", err)
        setError("🍳 Fridge Chef took a nap. Try again in a moment.")
    } finally { 
      setLoading(false)
    }
  }

  function addIngredient(formData) {
    const input = formData.get("ingredient")
  
    if (!input.trim()) return // ignore empty input
  
    const newIngredients = input
      .split(",")
      .map(item => item.trim())      // remove extra spaces
      .filter(item => item.length);  // remove empty strings
  
    setIngredients(prev => [...prev, ...newIngredients])
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

        {ingredients.length < 4 && (
            <div className="instructions">  
                <p>👋 Welcome! Tell Fridge Chef what ingredients you have, and he’ll whip up a tasty recipe.</p>
                <p>Add a minimum of 4 ingredients.</p>
            </div>
        )}


        {ingredients.length > 0 && (
            <IngredientsList 
              ref={recipeSection}
              ingredients={ingredients} 
              getRecipe={getRecipe} 
              />
        )}

        {loading && (
            <div className="thinking">
                <div className="spinner" />
                <span>Fridge Chef is thinking...</span>
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
