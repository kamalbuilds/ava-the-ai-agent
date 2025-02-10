/**
 * Prompt template for the final answer agent that standardizes and structures raw responses.
 *
 * @description
 * This template takes a user query, raw response, and tool usage information to produce
 * a consistently formatted response object with the following structure:
 *
 * {
 *   reasoning: string     - Explanation of the agent's thought process
 *   response: string|JSON - The formatted answer or JSON object
 *   status: "success"|"failure" - Execution status
 *   query: string        - Original user query
 *   errors: any[]        - Array of encountered errors, if any
 * }
 *
 * @example
 * The template enforces strict response formatting to ensure consistent
 * output structure across different tool executions.
 */
export default `this is the User query:\${query} and this is what your raw response \${response}. 
\${tools} tools were used.
This is raw and unrefined
Write down the response in this format 

[{
    "reasoning": string, // explain your reasoning in clear terms
    "response": string | JSON // clear terms detailed until explicitly stated otherwise. IF RESPONSE IS JSON, RETURN IT AS A JSON OBJECT
    "status": string ("success"| "failure") ,// success if no errors
    "query": string ,// initial user query; 
    "errors": any[], //if any
}]

DO NOT UNDER ANY CIRCUMSTANCES STRAY FROM THE RESPONSE FORMAT
RESPOND WITH ONLY THE RESPONSE FORMAT
`;
