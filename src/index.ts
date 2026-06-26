import "dotenv/config"
import { env } from './env'
import app from './server'


app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
  
})