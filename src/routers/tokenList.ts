import { publicProcedure, router } from "../trpc"

export const tokenListRouter = router({
	tokenList: publicProcedure.query(async () => {
		const tokenListResponse = await fetch(
			"https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
		)
		const tokenList = await tokenListResponse.json()
		return tokenList
	})
})
