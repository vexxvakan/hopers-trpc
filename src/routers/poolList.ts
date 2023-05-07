import { Decimal } from "decimal.js"
import type { Pool, Token } from "../config/types"
import { getCosmWasmClient } from "../utils/cosmwasmClient"
import { convertDenomToMicroDenom, convertMicroDenomToDenom } from "../utils/helpers"
import { queryRPC } from "../utils/queryRPC"
import { publicProcedure, router } from "../trpc"

export const poolListRouter = router({
	poolList: publicProcedure.query(async () => {
		const poolListResponse = await fetch(
			"https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/poolList.json"
		)
		const poolListJson = await poolListResponse.json()
		const poolList: Array<Pool> = poolListJson["pools"].map((pool: Pool) => {
			return pool
		})

		const tokenListResponse = await fetch(
			"https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
		)
		const tokenListJson = await tokenListResponse.json()
		const tokenList = tokenListJson["tokens"].map((token: Token) => {
			return token
		})

		const client = await getCosmWasmClient()

		const poolQueries = poolList.map((pool) => {
			return queryRPC(client, pool.swapAddress, { info: {} })
		})

		const poolInfos = await Promise.all(poolQueries)

		const hopersPrice = new Decimal(poolInfos[2].token2_reserve).dividedBy(
			new Decimal(poolInfos[2].token1_reserve)
		)

		const poolListWithData: Array<Pool> = poolInfos.map((poolInfo, index) => {
			const token1: Token = tokenList.find((token: Token) => {
				if (Object.keys(poolInfo.token1_denom)[0] === "cw20") {
					if (Object.values(poolInfo.token1_denom)[0] === token.contractAddress) {
						return token
					}
				} else {
					if (Object.values(poolInfo.token1_denom)[0] === token.denom) {
						return token
					}
				}
			})

			const token2: Token = tokenList.find((token: Token) => {
				if (Object.keys(poolInfo.token2_denom)[0] === "cw20") {
					if (Object.values(poolInfo.token2_denom)[0] === token.contractAddress) {
						return token.decimal
					}
				} else {
					if (Object.values(poolInfo.token2_denom)[0] === token.denom) {
						return token.decimal
					}
				}
			})

			const token2ReserveDenom = new Decimal(poolInfo.token2_reserve).dividedBy(
				convertDenomToMicroDenom(10, token2.decimal)
			)

			const token1ReserveDenom = new Decimal(poolInfo.token1_reserve).dividedBy(
				convertDenomToMicroDenom(10, token1.decimal)
			)

			console.log(index + 1, token2ReserveDenom.dividedBy(token1ReserveDenom).toFixed(24))

			const decimalDiff = token2.decimal - token1.decimal

			const token1Price =
				token1.denom === "hopers"
					? hopersPrice
					: new Decimal(
							new Decimal(poolInfo.token1_reserve).dividedBy(
								new Decimal(poolInfo.token2_reserve)
							)
					  ).times(hopersPrice)

			const token2Price = convertDenomToMicroDenom(
				new Decimal(
					new Decimal(poolInfo.token1_reserve).dividedBy(new Decimal(poolInfo.token2_reserve))
				).times(token1Price),
				decimalDiff
			)

			const poolWithData: Pool = {
				lpTokens: convertMicroDenomToDenom(poolInfo.lp_token_supply, 6),
				liquidity: {
					token1: {
						amount: new Decimal(poolInfo.token1_reserve),
						tokenPrice: token1Price,
						denom: token1.denom
					},
					token2: {
						amount: new Decimal(poolInfo.token2_reserve),
						tokenPrice: token2Price,
						denom: token2.denom
					},
					usd: 0
				},
				lpTokenAddress: poolInfo.lp_token_address,
				swapAddress: poolList[index].swapAddress,
				isVerified: poolList[index].isVerified,
				poolId: index + 1,
				ratio: token2ReserveDenom.dividedBy(token1ReserveDenom),
				bondingPeriods: []
			}

			return poolWithData
		})

		return poolListWithData
	})
})
