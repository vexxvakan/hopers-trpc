import { mergeRouters } from "../trpc"
import { poolListRouter } from "./poolList"
import { tokenRouter } from "./token"
import { tokenListRouter } from "./tokenList"

export const appRouter = mergeRouters(tokenRouter, tokenListRouter, poolListRouter)
export type AppRouter = typeof appRouter
