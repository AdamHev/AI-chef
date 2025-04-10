import express from "express"
import dotenv from "dotenv"
import Anthropic from "@anthropic-ai/sdk"
import cors from "cors"
import pkg from "pg"

dotenv.config()

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
})

const app = express()
app.use(cors())
app.use(express.json())

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an assistant...` // your custom Claude prompt

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
      if (errorType === "overloaded_error") {
        console.warn(`Overloaded. Retrying in ${delayMs}ms...`)
        await new Promise(res => setTimeout(res, delayMs))
        delayMs *= 2
      } else {
        throw error
      }
    }
  }
  throw new Error("Claude is still overloaded after multiple retries")
}

app.post("/api/recipe", async (req, res) => {
  const { ingredients } = req.body

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Invalid input: ingredients must be an array" })
  }

  const ingredientsString = ingredients.join(", ")

  try {
    const recipe = await requestRecipeWithRetry(ingredientsString)

    // Save to database
    await pool.query(
      "INSERT INTO recipes (ingredients, recipe) VALUES ($1, $2)",
      [ingredients, recipe]
    )

    res.json({ recipe })
  } catch (error) {
    console.error("Final error:", error.message || error)
    res.status(503).json({ error: "Claude is overloaded. Please try again shortly." })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
