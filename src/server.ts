import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify"
import fastify from "fastify"
import { appRouter } from "./routers"
import { createContext } from "./config/context"
import type { ServerOptions } from "./config/types"

export function createServer(opts: ServerOptions) {
	const dev = opts.dev ?? true
	const port = opts.port ?? 3000
	const prefix = opts.prefix ?? "/"
	const server = fastify({ logger: dev })

	void server.register(fastifyTRPCPlugin, {
		prefix,
		trpcOptions: { router: appRouter, createContext }
	})

	server.get("/", async () => {
		return { hello: "wait-on 💨" }
	})

	const stop = async () => {
		await server.close()
	}

	const start = async () => {
		try {
			await server.listen({ port })
			console.log("listening on port", port)
		} catch (err) {
			server.log.error(err)
			process.exit(1)
		}
	}

	return { server, start, stop }
}
