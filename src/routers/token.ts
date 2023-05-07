import type { Token } from "../config/types"
import { publicProcedure, router } from "../trpc"

export const tokenRouter = router({
	tokenBySymbol: publicProcedure.input(String).query(async ({ input }: { input: string }) => {
		const tokenListResponse = await fetch(
			"https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
		)
		const tokenList = await tokenListResponse.json()
		const token = tokenList["tokens"].find((token: Token) => token.symbol === input)

		return token
	})
})
