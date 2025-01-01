import { neo4j } from "@hypermode/modus-sdk-as"
import { models } from "@hypermode/modus-sdk-as"
import { openai } from "@hypermode/modus-sdk-as/models/openai"
import { JSON } from "json-as"

const HOST = "neo4j" // Connection name from modus.json

@json
class Token {
  address: string
  symbol: string
  amount: string // Using string for bigint compatibility

  constructor(address: string, symbol: string, amount: string) {
    this.address = address
    this.symbol = symbol
    this.amount = amount
  }
}

@json
class PortfolioValidation {
  operator: string
  assessment: string
  confidence: f32

  constructor(operator: string, assessment: string, confidence: f32) {
    this.operator = operator
    this.assessment = assessment
    this.confidence = confidence
  }
}

// Create a new portfolio in the knowledge graph
export function createPortfolio(tokens: Token[], strategy: string): string {
  const vars = new neo4j.Variables()
  vars.set("tokens", tokens)
  vars.set("strategy", strategy)

  const query = `
    CREATE (p:Portfolio {
      id: randomUUID(),
      strategy: $strategy,
      createdAt: datetime()
    })
    WITH p
    UNWIND $tokens as token
    MERGE (t:Token {address: token.address})
    ON CREATE SET t.symbol = token.symbol
    CREATE (p)-[:CONTAINS {amount: token.amount}]->(t)
    RETURN p.id as id
  `

  const result = neo4j.executeQuery(HOST, query, vars)
  if (result.Records.length === 0) {
    throw new Error("Failed to create portfolio")
  }

  return result.Records[0].getValue<string>("id")
}

// Get portfolio details with token holdings
export function getPortfolio(id: string): string {
  const vars = new neo4j.Variables()
  vars.set("id", id)

  const query = `
    MATCH (p:Portfolio {id: $id})-[h:CONTAINS]->(t:Token)
    RETURN {
      id: p.id,
      strategy: p.strategy,
      tokens: collect({
        address: t.address,
        symbol: t.symbol,
        amount: h.amount
      })
    } as portfolio
  `

  const result = neo4j.executeQuery(HOST, query, vars)
  return result.Records[0].get("portfolio")
}

// Validate a portfolio using AI
export function validatePortfolio(id: string): PortfolioValidation[] {
  // First get the portfolio data
  const portfolioData = getPortfolio(id)

  // Use GPT to analyze the portfolio
  const model = models.getModel<openai.ChatModel>("portfolio-analyzer")
  const prompt = `Analyze this portfolio: ${portfolioData}
    Provide a JSON array of validations with these fields:
    - operator: The validation check performed
    - assessment: A brief explanation of the validation result
    - confidence: A number between 0-1 indicating confidence
    Focus on: token eligibility, portfolio balance, and risk assessment.
  `

  const input = model.createInput(
    openai.NewSystemMessage("You are a portfolio validation expert."),
    openai.NewUserMessage(prompt)
  )

  const output = model.invoke(input)
  const validations = JSON.parse<PortfolioValidation[]>(output.Choices[0].Message.Content)

  // Store validations in knowledge graph
  const vars = new neo4j.Variables()
  vars.set("id", id)
  vars.set("validations", validations)

  const query = `
    MATCH (p:Portfolio {id: $id})
    SET p.lastValidated = datetime()
    WITH p
    UNWIND $validations as v
    CREATE (val:Validation {
      operator: v.operator,
      assessment: v.assessment,
      confidence: v.confidence,
      timestamp: datetime()
    })
    CREATE (p)-[:HAS_VALIDATION]->(val)
  `

  neo4j.executeQuery(HOST, query, vars)

  return validations
} 