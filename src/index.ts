import "dotenv/config"
import { env } from './env'
import app from './server'

// Start the server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
  console.log(`Environment: ${env.APP_STAGE}`)
})