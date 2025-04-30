import Fuse, { type IFuseOptions } from "fuse.js";

import {
  allowlistedTokens,
  type AllowlistedToken,
} from "@/utils/allowlist-tokens";

// Create an array of tokens
const tokens = Object.values(allowlistedTokens);

// Set up the fuse.js options
const options: IFuseOptions<AllowlistedToken> = {
  includeScore: true,
  keys: [
    { name: "name", weight: 0.5 },
    { name: "symbol", weight: 0.3 },
    { name: "id", weight: 0.2 },
  ],
  isCaseSensitive: false,
  threshold: 0.3, // Adjust the threshold for the desired level of fuzziness
};

// Create a new fuse instance
const fuse = new Fuse(tokens, options);

export const searchToken = (query: string): AllowlistedToken[] => {
  if (query.toLowerCase() === "near") return [allowlistedTokens["wrap.near"]];
  // Search the tokens with the query
  const result = fuse.search(query);

  // Map the result to only return the tokens
  return result.map((res) => res.item);
};
