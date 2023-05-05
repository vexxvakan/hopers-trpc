/** @format */

import path from "path"
import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import * as trpcExpress from "@trpc/server/adapters/express"
import customConfig from "./config/default"
import { inferAsyncReturnType, initTRPC } from "@trpc/server"

dotenv.config({ path: path.join(__dirname, "./.env") })

export type Context = inferAsyncReturnType<typeof createContext>
export type AppRouter = typeof appRouter

const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({ req, res })
const t = initTRPC.context<Context>().create()
const app = express()
const port = customConfig.port

const appRouter = t.router({
	test: t.procedure.query(async () => {
		const message = "test from backend"
		return { message }
	})
})

app.use(
	cors({
		origin: [customConfig.origin],
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
