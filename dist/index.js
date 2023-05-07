// src/server.ts
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify from "fastify";

// src/trpc.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  }
});
var router = t.router;
var mergeRouters = t.mergeRouters;
var publicProcedure = t.procedure;

// src/routers/poolList.ts
import { Decimal as Decimal2 } from "decimal.js";

// src/utils/cosmwasmClient.ts
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
var getCosmWasmClient = async () => {
  const client = await CosmWasmClient.connect("https://rpc.juno.basementnodes.ca");
  return client;
};

// src/utils/helpers.ts
import { Decimal } from "decimal.js";
function convertMicroDenomToDenom(value, decimals) {
  if (decimals === 0)
    return new Decimal(value);
  return new Decimal(Number(value) / Math.pow(10, decimals));
}
function convertDenomToMicroDenom(value, decimals) {
  if (decimals === 0)
    return new Decimal(value);
  return new Decimal(String(Number(value) * Math.pow(10, decimals)));
}

// src/utils/queryRPC.ts
var queryRPC = async (client, contractAddress, message) => {
  try {
    const result = await client.queryContractSmart(contractAddress, message);
    return result;
  } catch {
    return null;
  }
};

// src/routers/poolList.ts
var poolListRouter = router({
  poolList: publicProcedure.query(async () => {
    const poolListResponse = await fetch(
      "https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/poolList.json"
    );
    const poolListJson = await poolListResponse.json();
    const poolList = poolListJson["pools"].map((pool) => {
      return pool;
    });
    const tokenListResponse = await fetch(
      "https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
    );
    const tokenListJson = await tokenListResponse.json();
    const tokenList = tokenListJson["tokens"].map((token) => {
      return token;
    });
    const client = await getCosmWasmClient();
    const poolQueries = poolList.map((pool) => {
      return queryRPC(client, pool.swapAddress, { info: {} });
    });
    const poolInfos = await Promise.all(poolQueries);
    const hopersPrice = new Decimal2(poolInfos[2].token2_reserve).dividedBy(
      new Decimal2(poolInfos[2].token1_reserve)
    );
    const poolListWithData = poolInfos.map((poolInfo, index) => {
      const token1 = tokenList.find((token) => {
        if (Object.keys(poolInfo.token1_denom)[0] === "cw20") {
          if (Object.values(poolInfo.token1_denom)[0] === token.contractAddress) {
            return token;
          }
        } else {
          if (Object.values(poolInfo.token1_denom)[0] === token.denom) {
            return token;
          }
        }
      });
      const token2 = tokenList.find((token) => {
        if (Object.keys(poolInfo.token2_denom)[0] === "cw20") {
          if (Object.values(poolInfo.token2_denom)[0] === token.contractAddress) {
            return token.decimal;
          }
        } else {
          if (Object.values(poolInfo.token2_denom)[0] === token.denom) {
            return token.decimal;
          }
        }
      });
      const token2ReserveDenom = new Decimal2(poolInfo.token2_reserve).dividedBy(
        convertDenomToMicroDenom(10, token2.decimal)
      );
      const token1ReserveDenom = new Decimal2(poolInfo.token1_reserve).dividedBy(
        convertDenomToMicroDenom(10, token1.decimal)
      );
      console.log(index + 1, token2ReserveDenom.dividedBy(token1ReserveDenom).toFixed(24));
      const decimalDiff = token2.decimal - token1.decimal;
      const token1Price = token1.denom === "hopers" ? hopersPrice : new Decimal2(
        new Decimal2(poolInfo.token1_reserve).dividedBy(
          new Decimal2(poolInfo.token2_reserve)
        )
      ).times(hopersPrice);
      const token2Price = convertDenomToMicroDenom(
        new Decimal2(
          new Decimal2(poolInfo.token1_reserve).dividedBy(new Decimal2(poolInfo.token2_reserve))
        ).times(token1Price),
        decimalDiff
      );
      const poolWithData = {
        lpTokens: convertMicroDenomToDenom(poolInfo.lp_token_supply, 6),
        liquidity: {
          token1: {
            amount: new Decimal2(poolInfo.token1_reserve),
            tokenPrice: token1Price,
            denom: token1.denom
          },
          token2: {
            amount: new Decimal2(poolInfo.token2_reserve),
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
      };
      return poolWithData;
    });
    return poolListWithData;
  })
});

// src/routers/token.ts
var tokenRouter = router({
  tokenBySymbol: publicProcedure.input(String).query(async ({ input }) => {
    const tokenListResponse = await fetch(
      "https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
    );
    const tokenList = await tokenListResponse.json();
    const token = tokenList["tokens"].find((token2) => token2.symbol === input);
    return token;
  })
});

// src/routers/tokenList.ts
var tokenListRouter = router({
  tokenList: publicProcedure.query(async () => {
    const tokenListResponse = await fetch(
      "https://raw.githubusercontent.com/vexxvakan/hopers-tokenlist/main/tokenList.json"
    );
    const tokenList = await tokenListResponse.json();
    return tokenList;
  })
});

// src/routers/index.ts
var appRouter = mergeRouters(tokenRouter, tokenListRouter, poolListRouter);

// src/config/context.ts
function createContext({ req, res }) {
  const user = { name: req.headers.username ?? "anonymous" };
  return { req, res, user };
}

// src/server.ts
function createServer(opts) {
  const dev = opts.dev ?? true;
  const port = opts.port ?? 3e3;
  const prefix = opts.prefix ?? "/trpc";
  const server2 = fastify({ logger: dev });
  void server2.register(fastifyTRPCPlugin, {
    prefix,
    trpcOptions: { router: appRouter, createContext }
  });
  server2.get("/", async () => {
    return { hello: "wait-on \u{1F4A8}" };
  });
  const stop = async () => {
    await server2.close();
  };
  const start = async () => {
    try {
      await server2.listen({ port });
      console.log("listening on port", port);
    } catch (err) {
      server2.log.error(err);
      process.exit(1);
    }
  };
  return { server: server2, start, stop };
}

// src/config/config.ts
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
var { config } = dotenv;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../../env.local") });
console.log(process.env.DEV);
var serverConfig = {
  dev: process.env.DEV,
  port: 2022,
  prefix: "/"
};

// src/index.ts
var server = createServer(serverConfig);
void server.start();
//# sourceMappingURL=index.js.map
