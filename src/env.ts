if (!process.env.SERVER_SECRET) throw new Error('SERVER_SECRET is required')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

export const env = {
  PORT: process.env.PORT || 3000,
  APP_STAGE: process.env.APP_STAGE || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  SERVER_SECRET: process.env.SERVER_SECRET,
}