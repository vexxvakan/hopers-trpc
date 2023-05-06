import path from "path"
import * as dotenv from "dotenv"

const { config } = dotenv

config({ path: path.join(__dirname, "../../env.local") })

const customConfig: { port: number; origin: string } = {
	port: 8000,
	origin: process.env.ORIGIN as unknown as string
}

export default customConfig
