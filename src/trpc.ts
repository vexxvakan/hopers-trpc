import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import { Context } from "./config/context"

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape
	}
})

export const router = t.router
export const mergeRouters = t.mergeRouters
export const publicProcedure = t.procedure
