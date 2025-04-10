import React from "react"
import IngredientsList from "./components/IngredientsList"
import ClaudeRecipe from "./components/ClaudeRecipe"
import { useEffect } from "react"
import { getRecipeFromChefClaude } from "./ai"
import { marked } from "marked"

export default function Main1() {
  const [ingredients, setIngredients] = React.useState([]) 
  const [recipe, setRecipe] = React.useState("") 
  const [loading, setLoading] = React.useState(false) 
  const [error, setError] = React.useState("")
  const [savedRecipes, setSavedRecipes] = React.useState(() => loadSavedRecipes())

  const recipeSection = React.useRef(null) // Create a ref for the recipe

  // Scroll to the recipe section when a recipe is generated or an error occurs
  // This effect runs when the recipe or error state changes
  useEffect(() => {
    if ((recipe !== "" || error !== "") && recipeSection.current !== null) {
      recipeSection.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [recipe, error])
  
  // If it becomes empty (length === 0), we reset the relevant UI state
  useEffect(() => {
    if (ingredients.length === 0) {
      setRecipe("")
      setError("")
    }
  }, [ingredients])


  // Function to get a recipe from Chef Claude
  // This function is called when the user clicks the "Get a recipe" button
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

  // Function to add an ingredient to the list
  // This function is called when the user submits the form
  // Normalizes casing ("Milk" → "milk")
  // Filters out blanks
  // Only adds new, unique ingredients
  function addIngredient(formData) {
    const input = formData.get("ingredient")
  
    if (!input.trim()) return
  
    const newIngredients = input
      .split(",")
      .map(item => item.trim().toLowerCase()) // normalize casing
      .filter(item => item.length)
  
    setIngredients(prev => {
      const allIngredients = [...prev]
      newIngredients.forEach(item => {
        if (!allIngredients.includes(item)) {
          allIngredients.push(item)
        }
      })
      return allIngredients
    })
  }
  

  // Function to remove an ingredient from the list
  function removeIngredient(index) {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }



  // LOCAL STORAGE

  function saveRecipeLocally(recipeMarkdown) {
    const saved = JSON.parse(localStorage.getItem("savedRecipes") || "[]")
    const recipeHtml = marked.parse(recipeMarkdown)
    saved.push(recipeHtml)  
    localStorage.setItem("savedRecipes", JSON.stringify(saved))
  }
  
  
  function loadSavedRecipes() {
    return JSON.parse(localStorage.getItem("savedRecipes") || "[]")
  }
  
  function clearSavedRecipes() {
    localStorage.removeItem("savedRecipes")
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
              removeIngredient={removeIngredient}
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
        {recipe && !error && (
          <button className="save-button" onClick={() => {
            saveRecipeLocally(recipe)
            setSavedRecipes(loadSavedRecipes()) // update UI
          }}>
            ❤️ Save Recipe
          </button>
        )}

        {savedRecipes.length > 0 && (
          <section className="saved-recipes">
            <h2>Saved Recipes</h2>
            {savedRecipes.map((rec, i) => (
              <div key={i} className="saved-recipe">
                <div dangerouslySetInnerHTML={{ __html: rec }} />
              </div>
            ))}
            <button onClick={() => {
              clearSavedRecipes()
              setSavedRecipes([])
            }} className="clear-saved-recipes">
              🗑️  Clear Saved Recipes
            </button>
          </section>
        )}

    </main>
  )
}
