export const env = {
  PORT: process.env.PORT || 3000,
  APP_STAGE: process.env.APP_STAGE || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  SERVER_SECRET: process.env.SERVER_SECRET,
}
