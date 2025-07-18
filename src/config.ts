process.env.DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || "36a3e451ce78.ngrok-free.app";

if (!process.env.DEPLOYMENT_URL) {
  throw new Error(`Missing Deployment URL for bot, for local this would be localhost:PORT`)
}
export const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL
