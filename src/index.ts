import { createServer } from "./server"
import { serverConfig } from "./config"

const server = createServer(serverConfig)
void server.start()
