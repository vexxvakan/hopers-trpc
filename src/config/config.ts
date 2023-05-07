import path from "path"
import { fileURLToPath } from "url"
import type { ServerOptions } from "./types"
import "dotenv/config"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// config({ path: path.join(__dirname, "../../env.local") })
console.log(process.env.DEV)

export const serverConfig: ServerOptions = {
	dev: process.env.DEV as unknown as boolean,
	port: 2022,
	prefix: "/"
}
