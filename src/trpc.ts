import { initTRPC } from "@trpc/server"
import type { Context } from "./app"

export const t = initTRPC.context<Context>().create()
