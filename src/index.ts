import "dotenv/config"
import { env } from './env'
import { startServer } from './server'

startServer(Number(env.PORT))