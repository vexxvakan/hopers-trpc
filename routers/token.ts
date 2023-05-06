import type { Token } from "../config/types"
import { t } from "../trpc"

export const tokenRouter = t.router({
	tokenBySymbol: t.procedure.input(String).query(async ({ input }) => {
		const tokenListResponse = await fetch(
			"https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
		)
		const tokenList = await tokenListResponse.json()
		const token = tokenList["tokens"].find((token: Token) => token.symbol === input)

		return token
	})
})
