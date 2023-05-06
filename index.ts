import path from "path"
import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import * as trpcExpress from "@trpc/server/adapters/express"
import config from "./config/default"
import { inferAsyncReturnType, initTRPC } from "@trpc/server"
import { appRouter } from "./routers"

dotenv.config({ path: path.join(__dirname, "./.env") })

const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({ req, res })
export type Context = inferAsyncReturnType<typeof createContext>

const app = express()
const port = config.port

app.use(
	cors({
		origin: [config.origin],
		credentials: true
	})
)

app.use(
	"/",
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext
	})
)

app.listen(port, () => {
	console.log(`🚀 Server listening on port ${port}`)
})
