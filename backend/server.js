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
  baseURL: "https://api.anthropic.com"
})

const SYSTEM_PROMPT = `You are an assistant that suggests recipes based on a list of ingredients.
You respond in markdown format, with a title, a list of ingredients, and step-by-step instructions.
If the ingredients are insufficient to make a reasonable recipe, politely explain this and suggest adding more ingredients.
Keep your response concise and relevant to the ingredients provided.`

async function requestRecipeWithRetry(ingredientsString, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
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
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Invalid input: ingredients must be an array" });
  }

  const ingredientsString = ingredients.join(", ");

  let recipe;
  try {
    recipe = await requestRecipeWithRetry(ingredientsString);
  } catch (error) {
    console.error("Claude error:", error.message || error);
    return res.status(503).json({ error: "Claude is overloaded. Please try again shortly." });
  }

  res.json({ recipe });
});


console.log("API key present?", Boolean(process.env.ANTHROPIC_API_KEY))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
