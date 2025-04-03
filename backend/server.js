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
You are an assistant that receives a list of ingredients that a user has and suggests a recipe...
`

app.post("/api/recipe", async (req, res) => {
  const { ingredients } = req.body
  const ingredientsString = ingredients.join(", ")

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

    res.json({ recipe: msg.content[0].text })
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ error: "Something went wrong with Claude API" })
  }
})

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001")
})
