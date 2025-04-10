export default function IngredientsList(props) {
    const ingredientsListItems = props.ingredients.map((ingredient, index) => (
      <li key={ingredient} className="ingredient-item">
        {ingredient}
        <button
          className="remove-button"
          aria-label={`Remove ${ingredient}`}
          onClick={() => props.removeIngredient(index)}
        >
          ✖
        </button>
      </li>
    ))
  
    return (
      <section>
        <h2>Ingredients on hand:</h2>
        <ul className="ingredients-list" aria-live="polite">
          {ingredientsListItems}
        </ul>
  
        {props.ingredients.length > 3 && (
          <div className="get-recipe-container">
            <div ref={props.ref}>
              <h3>Ready for a recipe?</h3>
              <p>Generate a recipe from your list of ingredients. Customize your recipe by removing or adding ingredients.</p>
            </div>
            <button onClick={props.getRecipe}>Get a recipe</button>
          </div>
        )}
      </section>
    )
  }
  