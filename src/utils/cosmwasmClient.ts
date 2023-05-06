import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"

export const getCosmWasmClient = async () => {
	const client = await CosmWasmClient.connect("https://rpc.juno.basementnodes.ca")
	return client
}
