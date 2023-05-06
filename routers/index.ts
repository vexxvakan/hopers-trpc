import { t } from "../trpc"
import { poolListRouter } from "./poolList"
import { tokenRouter } from "./token"
import { tokenListRouter } from "./tokenList"

export const appRouter = t.mergeRouters(tokenRouter, tokenListRouter, poolListRouter)

export type AppRouter = typeof appRouter
