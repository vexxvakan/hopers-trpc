import { t } from "../trpc"

export const tokenListRouter = t.router({
	tokenList: t.procedure.query(async () => {
		const tokenListResponse = await fetch(
			"https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
		)
		const tokenList = await tokenListResponse.json()
		return tokenList
	})
})
