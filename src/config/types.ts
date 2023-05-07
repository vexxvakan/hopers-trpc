import type { Decimal } from "decimal.js"

export type ServerOptions = {
	dev?: boolean
	port?: number
	prefix?: string
}

export type Token = {
	isNativeCoin: boolean
	isIBCCoin: boolean
	chain: Chain
	fullName: string
	decimal: number
	denom: string
	symbol: string
	logoURI: string
	contractAddress?: string
}

export type Chain = {
	chainName: string
	chainId: string
	gasPrice: {
		denom: string
		amount: string
	}
	isEVM: boolean
	ibcChannels?: {
		deposit_channel: string
		withdraw_channel: string
	}
	evmChainId?: number
}

export type BondingPeriod = {
	apr: number
	stakingAddress: string
	rewardToken: string
	lockDuration: number
	distributionEnd: number
}

export type LiquidityToken = {
	amount: Decimal
	tokenPrice: Decimal
	denom: string
}

export type Liquidity = {
	usd: number
	token1: LiquidityToken
	token2: LiquidityToken
}

export type Pool = {
	bondingPeriods: Array<BondingPeriod>
	poolId: number
	swapAddress: string
	ratio: Decimal
	lpTokenAddress: string
	lpTokens: Decimal
	isVerified: boolean
	liquidity: Liquidity
}
