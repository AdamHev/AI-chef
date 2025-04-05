import express from "express"
import dotenv from "dotenv"
import Anthropic from "@anthropic-ai/sdk"
import cors from "cors"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page.
`

// 🔁 Retry logic for Claude API with exponential backoff
async function requestRecipeWithRetry(ingredientsString, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!`,
          },
        ],
      })

      return msg.content[0].text
    } catch (error) {
      const errorType = error?.error?.error?.type
      console.warn(`Error on attempt ${attempt}:`, errorType || error.message)

      if (errorType === "overloaded_error") {
        console.warn(`Claude overloaded — retrying in ${delayMs}ms...`)
        await new Promise(res => setTimeout(res, delayMs))
        delayMs *= 2 // exponential backoff
      } else {
        throw error // stop retrying on non-overload error
      }
    }
  }

  throw new Error("Claude is still overloaded after multiple retries")
}

// ✅ Main recipe route
app.post("/api/recipe", async (req, res) => {
  const { ingredients } = req.body

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Invalid input: ingredients must be an array" })
  }

  const ingredientsString = ingredients.join(", ")

  try {
    const recipe = await requestRecipeWithRetry(ingredientsString)
    res.json({ recipe })
  } catch (error) {
    console.error("Final error:", error.message || error)
    res.status(503).json({ error: "Claude is overloaded. Please try again shortly." })
  }
})

// 🌍 Listen on the proper port
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
