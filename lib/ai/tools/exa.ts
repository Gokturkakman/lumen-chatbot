import Exa from "exa-js";

let client: Exa | null = null;

export function hasExa(): boolean {
  return Boolean(process.env.EXA_API_KEY);
}

export function getExa(): Exa {
  if (!process.env.EXA_API_KEY) {
    throw new Error("EXA_API_KEY is not configured");
  }
  client ??= new Exa(process.env.EXA_API_KEY);
  return client;
}
