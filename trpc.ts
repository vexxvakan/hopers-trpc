import { initTRPC } from "@trpc/server"
import type { Context } from "."

export const t = initTRPC.context<Context>().create()
