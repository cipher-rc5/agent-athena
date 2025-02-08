// src/index.ts
import { DirectClient } from "@elizaos/client-direct";
import { AgentRuntime, elizaLogger as elizaLogger11, settings as settings3, stringToUuid } from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
import { solanaPlugin } from "@elizaos/plugin-solana";
import fs2 from "fs";
import net from "net";
import path3 from "path";
import { fileURLToPath } from "url";

// src/cache/index.ts
import { CacheManager, DbCacheAdapter } from "@elizaos/core";
function initializeDbCache(character2, db) {
  const cache = new CacheManager(new DbCacheAdapter(db, character2.id));
  return cache;
}

// src/character.ts
import { Clients, ModelProviderName } from "@elizaos/core";

// plugins/plugin-coingecko/src/actions/getMarkets.ts
import { composeContext, elizaLogger as elizaLogger2, generateObject, ModelClass } from "@elizaos/core";
import axios2 from "axios";
import { z as z2 } from "zod";

// plugins/plugin-coingecko/src/environment.ts
import { z } from "zod";
var coingeckoConfigSchema = z.object({
  COINGECKO_API_KEY: z.string().nullable(),
  COINGECKO_PRO_API_KEY: z.string().nullable()
}).refine((data) => data.COINGECKO_API_KEY || data.COINGECKO_PRO_API_KEY, {
  message: "Either COINGECKO_API_KEY or COINGECKO_PRO_API_KEY must be provided"
});
async function validateCoingeckoConfig(runtime) {
  const config = {
    COINGECKO_API_KEY: runtime.getSetting("COINGECKO_API_KEY"),
    COINGECKO_PRO_API_KEY: runtime.getSetting("COINGECKO_PRO_API_KEY")
  };
  return coingeckoConfigSchema.parse(config);
}
function getApiConfig(config) {
  const isPro = !!config.COINGECKO_PRO_API_KEY;
  return {
    baseUrl: isPro ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3",
    apiKey: isPro ? config.COINGECKO_PRO_API_KEY : config.COINGECKO_API_KEY,
    headerKey: isPro ? "x-cg-pro-api-key" : "x-cg-demo-api-key"
  };
}

// plugins/plugin-coingecko/src/providers/categoriesProvider.ts
import { elizaLogger } from "@elizaos/core";
import axios from "axios";
var CACHE_KEY = "coingecko:categories";
var CACHE_TTL = 5 * 60;
var MAX_RETRIES = 3;
async function fetchCategories(runtime) {
  const config = await validateCoingeckoConfig(runtime);
  const { baseUrl, apiKey, headerKey } = getApiConfig(config);
  const response = await axios.get(`${baseUrl}/coins/categories/list`, {
    headers: { "accept": "application/json", [headerKey]: apiKey },
    timeout: 5e3
    // 5 second timeout
  });
  if (!response.data?.length) {
    throw new Error("Invalid categories data received");
  }
  return response.data;
}
async function fetchWithRetry(runtime) {
  let lastError = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fetchCategories(runtime);
    } catch (error) {
      lastError = error;
      elizaLogger.error(`Categories fetch attempt ${i + 1} failed:`, error);
      await new Promise((resolve) => setTimeout(resolve, 1e3 * (i + 1)));
    }
  }
  throw lastError || new Error("Failed to fetch categories after multiple attempts");
}
async function getCategories(runtime) {
  try {
    const cached = await runtime.cacheManager.get(CACHE_KEY);
    if (cached) {
      return cached;
    }
    const categories = await fetchWithRetry(runtime);
    await runtime.cacheManager.set(CACHE_KEY, categories, { expires: CACHE_TTL });
    return categories;
  } catch (error) {
    elizaLogger.error("Error fetching categories:", error);
    throw error;
  }
}
function formatCategoriesContext(categories) {
  const popularCategories = [
    "layer-1",
    "defi",
    "meme",
    "ai-meme-coins",
    "artificial-intelligence",
    "gaming",
    "metaverse"
  ];
  const popular = categories.filter((c) => popularCategories.includes(c.category_id)).map(
    (c) => `${c.name} (${c.category_id})`
  );
  return `
Available cryptocurrency categories:

Popular categories:
${popular.map((c) => `- ${c}`).join("\n")}

Total available categories: ${categories.length}

You can use these category IDs when filtering cryptocurrency market data.
`.trim();
}
var categoriesProvider = {
  // eslint-disable-next-line
  get: async (runtime, message, state) => {
    try {
      const categories = await getCategories(runtime);
      return formatCategoriesContext(categories);
    } catch (error) {
      elizaLogger.error("Categories provider error:", error);
      return "Cryptocurrency categories are temporarily unavailable. Please try again later.";
    }
  }
};
async function getCategoriesData(runtime) {
  return getCategories(runtime);
}

// plugins/plugin-coingecko/src/templates/markets.ts
var getMarketsTemplate = `
Extract the following parameters for market listing:
- **vs_currency** (string): Target currency for price data (default: "usd")
- **category** (string, optional): Specific category ID from the available categories
- **per_page** (number): Number of results to return (1-250, default: 20)
- **order** (string): Sort order for results, one of:
  - market_cap_desc: Highest market cap first
  - market_cap_asc: Lowest market cap first
  - volume_desc: Highest volume first
  - volume_asc: Lowest volume first

Available Categories:
{{categories}}

Provide the values in the following JSON format:

\`\`\`json
{
    "vs_currency": "<currency>",
    "category": "<category_id>",
    "per_page": <number>,
    "order": "<sort_order>",
    "page": 1,
    "sparkline": false
}
\`\`\`

Example request: "Show me the top 10 gaming cryptocurrencies"
Example response:
\`\`\`json
{
    "vs_currency": "usd",
    "category": "gaming",
    "per_page": 10,
    "order": "market_cap_desc",
    "page": 1,
    "sparkline": false
}
\`\`\`

Example request: "What are the best performing coins by volume?"
Example response:
\`\`\`json
{
    "vs_currency": "usd",
    "per_page": 20,
    "order": "volume_desc",
    "page": 1,
    "sparkline": false
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}

Based on the conversation above, if the request is for a market listing/ranking, extract the appropriate parameters and respond with a JSON object. If the request is for specific coins only, respond with null.`;

// plugins/plugin-coingecko/src/actions/getMarkets.ts
function formatCategory(category, categories) {
  if (!category) return void 0;
  const normalizedInput = category.toLowerCase().trim();
  const exactMatch = categories.find((c) => c.category_id === normalizedInput);
  if (exactMatch) {
    return exactMatch.category_id;
  }
  const nameMatch = categories.find(
    (c) => c.name.toLowerCase() === normalizedInput || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === normalizedInput
  );
  if (nameMatch) {
    return nameMatch.category_id;
  }
  const partialMatch = categories.find(
    (c) => c.name.toLowerCase().includes(normalizedInput) || c.category_id.includes(normalizedInput)
  );
  if (partialMatch) {
    return partialMatch.category_id;
  }
  return void 0;
}
var GetMarketsSchema = z2.object({
  vs_currency: z2.string().default("usd"),
  category: z2.string().optional(),
  order: z2.enum(["market_cap_desc", "market_cap_asc", "volume_desc", "volume_asc"]).default("market_cap_desc"),
  per_page: z2.number().min(1).max(250).default(20),
  page: z2.number().min(1).default(1),
  sparkline: z2.boolean().default(false)
});
var isGetMarketsContent = (obj) => {
  return GetMarketsSchema.safeParse(obj).success;
};
var getMarkets_default = {
  name: "GET_MARKETS",
  similes: [
    "MARKET_OVERVIEW",
    "TOP_RANKINGS",
    "MARKET_LEADERBOARD",
    "CRYPTO_RANKINGS",
    "BEST_PERFORMING_COINS",
    "TOP_MARKET_CAPS"
  ],
  // eslint-disable-next-line
  validate: async (runtime, message) => {
    await validateCoingeckoConfig(runtime);
    return true;
  },
  // Comprehensive endpoint for market rankings, supports up to 250 coins per request
  description: "Get ranked list of top cryptocurrencies sorted by market metrics (without specifying coins)",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger2.log("Starting CoinGecko GET_MARKETS handler...");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    try {
      const config = await validateCoingeckoConfig(runtime);
      const { baseUrl, apiKey, headerKey } = getApiConfig(config);
      const categories = await getCategoriesData(runtime);
      const marketsContext = composeContext({
        state,
        template: getMarketsTemplate.replace(
          "{{categories}}",
          categories.map((c) => `- ${c.name} (ID: ${c.category_id})`).join("\n")
        )
      });
      const result = await generateObject({
        runtime,
        context: marketsContext,
        modelClass: ModelClass.SMALL,
        schema: GetMarketsSchema
      });
      if (!isGetMarketsContent(result.object)) {
        elizaLogger2.error("Invalid market data format received");
        return false;
      }
      const content = result.object;
      elizaLogger2.log("Content from template:", content);
      if (!content) {
        return false;
      }
      const formattedCategory = formatCategory(content.category, categories);
      if (content.category && !formattedCategory) {
        throw new Error(`Invalid category: ${content.category}. Please choose from the available categories.`);
      }
      elizaLogger2.log("Making API request with params:", {
        url: `${baseUrl}/coins/markets`,
        category: formattedCategory,
        vs_currency: content.vs_currency,
        order: content.order,
        per_page: content.per_page,
        page: content.page
      });
      const response = await axios2.get(`${baseUrl}/coins/markets`, {
        headers: { "accept": "application/json", [headerKey]: apiKey },
        params: {
          vs_currency: content.vs_currency,
          category: formattedCategory,
          order: content.order,
          per_page: content.per_page,
          page: content.page,
          sparkline: content.sparkline
        }
      });
      if (!response.data?.length) {
        throw new Error("No market data received from CoinGecko API");
      }
      const formattedData = response.data.map((coin) => ({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        marketCapRank: coin.market_cap_rank,
        currentPrice: coin.current_price,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        lastUpdated: coin.last_updated
      }));
      const categoryDisplay = content.category ? `${categories.find((c) => c.category_id === formattedCategory)?.name.toUpperCase() || content.category.toUpperCase()} ` : "";
      const responseText = [
        `Top ${formattedData.length} ${categoryDisplay}Cryptocurrencies by ${content.order === "volume_desc" || content.order === "volume_asc" ? "Volume" : "Market Cap"}:`,
        ...formattedData.map(
          (coin, index) => `${index + 1}. ${coin.name} (${coin.symbol}) | $${coin.currentPrice.toLocaleString()} | ${coin.priceChangePercentage24h.toFixed(2)}% | MCap: $${(coin.marketCap / 1e9).toFixed(2)}B`
        )
      ].join("\n");
      elizaLogger2.success("Market data retrieved successfully!");
      if (callback) {
        callback({
          text: responseText,
          content: {
            markets: formattedData,
            params: {
              vs_currency: content.vs_currency,
              category: content.category,
              order: content.order,
              per_page: content.per_page,
              page: content.page
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      }
      return true;
    } catch (error) {
      elizaLogger2.error("Error in GET_MARKETS handler:", error);
      let errorMessage;
      if (error.response?.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else if (error.response?.status === 403) {
        errorMessage = "This endpoint requires a CoinGecko Pro API key. Please upgrade your plan to access this data.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid request parameters. Please check your input.";
      } else {
        errorMessage = `Error fetching market data: ${error.message}`;
      }
      if (callback) {
        callback({
          text: errorMessage,
          error: {
            message: error.message,
            statusCode: error.response?.status,
            params: error.config?.params,
            requiresProPlan: error.response?.status === 403
          }
        });
      }
      return false;
    }
  },
  examples: [[{ user: "{{user1}}", content: { text: "Show me the top cryptocurrencies by market cap" } }, {
    user: "{{agent}}",
    content: { text: "I'll fetch the current market data for top cryptocurrencies.", action: "GET_MARKETS" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Here are the top cryptocurrencies:\n1. Bitcoin (BTC) | $45,000 | +2.5% | MCap: $870.5B\n{{dynamic}}"
    }
  }]]
};

// plugins/plugin-coingecko/src/actions/getNewlyListed.ts
import { composeContext as composeContext2, elizaLogger as elizaLogger3, generateObject as generateObject2, ModelClass as ModelClass2 } from "@elizaos/core";
import axios3 from "axios";
import { z as z3 } from "zod";

// plugins/plugin-coingecko/src/templates/newCoins.ts
var getNewCoinsTemplate = `Determine if this is a new coins request. If it is one of the specified situations, perform the corresponding action:

Situation 1: "Get all new coins"
- Message contains: phrases like "all new coins", "all recent listings", "all latest coins"
- Example: "Show me all new coin listings" or "List all recently added coins"
- Action: Return with limit=50

Situation 2: "Get specific number of new coins"
- Message contains: number followed by "new coins" or "latest" followed by number and "coins"
- Example: "Show me 5 new coins" or "Get the latest 20 coins"
- Action: Return with limit=specified number

Situation 3: "Default new coins request"
- Message contains: general phrases like "new coins", "recent listings", "latest coins"
- Example: "What are the newest coins?" or "Show me recent listings"
- Action: Return with limit=10

For all situations, respond with a JSON object in the format:
\`\`\`json
{
    "limit": number
}
\`\`\`

Previous conversation for context:
{{conversation}}

You are replying to: {{message}}
`;

// plugins/plugin-coingecko/src/actions/getNewlyListed.ts
var GetNewCoinsSchema = z3.object({ limit: z3.number().min(1).max(50).default(10) });
var isGetNewCoinsContent = (obj) => {
  return GetNewCoinsSchema.safeParse(obj).success;
};
var getNewlyListed_default = {
  name: "GET_NEW_COINS",
  similes: ["NEW_COINS", "RECENTLY_ADDED", "NEW_LISTINGS", "LATEST_COINS"],
  validate: async (runtime, message) => {
    await validateCoingeckoConfig(runtime);
    return true;
  },
  description: "Get list of recently added coins from CoinGecko",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger3.log("Starting CoinGecko GET_NEW_COINS handler...");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    try {
      elizaLogger3.log("Composing new coins context...");
      const newCoinsContext = composeContext2({ state, template: getNewCoinsTemplate });
      const result = await generateObject2({
        runtime,
        context: newCoinsContext,
        modelClass: ModelClass2.LARGE,
        schema: GetNewCoinsSchema
      });
      if (!isGetNewCoinsContent(result.object)) {
        elizaLogger3.error("Invalid new coins request format");
        return false;
      }
      const config = await validateCoingeckoConfig(runtime);
      const { baseUrl, apiKey, headerKey } = getApiConfig(config);
      elizaLogger3.log("Fetching new coins data...");
      const response = await axios3.get(`${baseUrl}/coins/list/new`, {
        headers: { [headerKey]: apiKey }
      });
      if (!response.data) {
        throw new Error("No data received from CoinGecko API");
      }
      const formattedData = response.data.slice(0, result.object.limit).map((coin) => ({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        activatedAt: new Date(coin.activated_at * 1e3).toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      }));
      const responseText = [
        "Recently Added Coins:",
        "",
        ...formattedData.map(
          (coin, index) => `${index + 1}. ${coin.name} (${coin.symbol})
   Listed: ${coin.activatedAt}`
        )
      ].join("\n");
      elizaLogger3.success("New coins data retrieved successfully!");
      if (callback) {
        callback({ text: responseText, content: { newCoins: formattedData, timestamp: (/* @__PURE__ */ new Date()).toISOString() } });
      }
      return true;
    } catch (error) {
      elizaLogger3.error("Error in GET_NEW_COINS handler:", error);
      const errorMessage = error.response?.status === 429 ? "Rate limit exceeded. Please try again later." : `Error fetching new coins data: ${error.message}`;
      if (callback) {
        callback({ text: errorMessage, content: { error: error.message, statusCode: error.response?.status } });
      }
      return false;
    }
  },
  examples: [[{ user: "{{user1}}", content: { text: "What are the newest coins listed?" } }, {
    user: "{{agent}}",
    content: { text: "I'll check the recently added coins for you.", action: "GET_NEW_COINS" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Here are the recently added coins:\n1. Verb Ai (VERB)\n   Listed: January 20, 2025, 12:31 PM\n{{dynamic}}"
    }
  }]]
};

// plugins/plugin-coingecko/src/actions/getPrice.ts
import { composeContext as composeContext3, elizaLogger as elizaLogger5, generateObject as generateObject3, ModelClass as ModelClass3 } from "@elizaos/core";
import axios5 from "axios";
import { z as z4 } from "zod";

// plugins/plugin-coingecko/src/providers/coinsProvider.ts
import { elizaLogger as elizaLogger4 } from "@elizaos/core";
import axios4 from "axios";
var CACHE_KEY2 = "coingecko:coins";
var CACHE_TTL2 = 5 * 60;
var MAX_RETRIES2 = 3;
async function fetchCoins(runtime, includePlatform = false) {
  const config = await validateCoingeckoConfig(runtime);
  const { baseUrl, apiKey, headerKey } = getApiConfig(config);
  const response = await axios4.get(`${baseUrl}/coins/list`, {
    params: { include_platform: includePlatform },
    headers: { "accept": "application/json", [headerKey]: apiKey },
    timeout: 5e3
    // 5 second timeout
  });
  if (!response.data?.length) {
    throw new Error("Invalid coins data received");
  }
  return response.data;
}
async function fetchWithRetry2(runtime, includePlatform = false) {
  let lastError = null;
  for (let i = 0; i < MAX_RETRIES2; i++) {
    try {
      return await fetchCoins(runtime, includePlatform);
    } catch (error) {
      lastError = error;
      elizaLogger4.error(`Coins fetch attempt ${i + 1} failed:`, error);
      await new Promise((resolve) => setTimeout(resolve, 1e3 * (i + 1)));
    }
  }
  throw lastError || new Error("Failed to fetch coins after multiple attempts");
}
async function getCoins(runtime, includePlatform = false) {
  try {
    const cached = await runtime.cacheManager.get(CACHE_KEY2);
    if (cached) {
      return cached;
    }
    const coins = await fetchWithRetry2(runtime, includePlatform);
    await runtime.cacheManager.set(CACHE_KEY2, coins, { expires: CACHE_TTL2 });
    return coins;
  } catch (error) {
    elizaLogger4.error("Error fetching coins:", error);
    throw error;
  }
}
function formatCoinsContext(coins) {
  const popularCoins = ["bitcoin", "ethereum", "binancecoin", "ripple", "cardano", "solana", "polkadot", "dogecoin"];
  const popular = coins.filter((c) => popularCoins.includes(c.id)).map(
    (c) => `${c.name} (${c.symbol.toUpperCase()}) - ID: ${c.id}`
  );
  return `
Available cryptocurrencies:

Popular coins:
${popular.map((c) => `- ${c}`).join("\n")}

Total available coins: ${coins.length}

You can use these coin IDs when querying specific cryptocurrency data.
`.trim();
}
var coinsProvider = {
  // eslint-disable-next-line
  get: async (runtime, message, state) => {
    try {
      const coins = await getCoins(runtime);
      return formatCoinsContext(coins);
    } catch (error) {
      elizaLogger4.error("Coins provider error:", error);
      return "Cryptocurrency list is temporarily unavailable. Please try again later.";
    }
  }
};
async function getCoinsData(runtime, includePlatform = false) {
  return getCoins(runtime, includePlatform);
}

// plugins/plugin-coingecko/src/templates/price.ts
var getPriceTemplate = `
Extract the following parameters for cryptocurrency price data:
- **coinIds** (string | string[]): The ID(s) of the cryptocurrency/cryptocurrencies to get prices for (e.g., "bitcoin" or ["bitcoin", "ethereum"])
- **currency** (string | string[]): The currency/currencies to display prices in (e.g., "usd" or ["usd", "eur", "jpy"]) - defaults to ["usd"]
- **include_market_cap** (boolean): Whether to include market cap data - defaults to false
- **include_24hr_vol** (boolean): Whether to include 24h volume data - defaults to false
- **include_24hr_change** (boolean): Whether to include 24h price change data - defaults to false
- **include_last_updated_at** (boolean): Whether to include last update timestamp - defaults to false

Provide the values in the following JSON format:

\`\`\`json
{
    "coinIds": "bitcoin",
    "currency": ["usd"],
    "include_market_cap": false,
    "include_24hr_vol": false,
    "include_24hr_change": false,
    "include_last_updated_at": false
}
\`\`\`

Example request: "What's the current price of Bitcoin?"
Example response:
\`\`\`json
{
    "coinIds": "bitcoin",
    "currency": ["usd"],
    "include_market_cap": false,
    "include_24hr_vol": false,
    "include_24hr_change": false,
    "include_last_updated_at": false
}
\`\`\`

Example request: "Show me ETH price and market cap in EUR with last update time"
Example response:
\`\`\`json
{
    "coinIds": "ethereum",
    "currency": ["eur"],
    "include_market_cap": true,
    "include_24hr_vol": false,
    "include_24hr_change": false,
    "include_last_updated_at": true
}
\`\`\`

Example request: "What's the current price of Bitcoin in USD, JPY and EUR?"
Example response:
\`\`\`json
{
    "coinIds": "bitcoin",
    "currency": ["usd", "jpy", "eur"],
    "include_market_cap": false,
    "include_24hr_vol": false,
    "include_24hr_change": false,
    "include_last_updated_at": false
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}

Based on the conversation above, if the request is for cryptocurrency price data, extract the appropriate parameters and respond with a JSON object. If the request is not related to price data, respond with null.`;

// plugins/plugin-coingecko/src/actions/getPrice.ts
var GetPriceSchema = z4.object({
  coinIds: z4.union([z4.string(), z4.array(z4.string())]),
  currency: z4.union([z4.string(), z4.array(z4.string())]).default(["usd"]),
  include_market_cap: z4.boolean().default(false),
  include_24hr_vol: z4.boolean().default(false),
  include_24hr_change: z4.boolean().default(false),
  include_last_updated_at: z4.boolean().default(false)
});
var isGetPriceContent = (obj) => {
  return GetPriceSchema.safeParse(obj).success;
};
function formatCoinIds(input) {
  if (Array.isArray(input)) {
    return input.join(",");
  }
  return input;
}
var getPrice_default = {
  name: "GET_PRICE",
  similes: [
    "COIN_PRICE_CHECK",
    "SPECIFIC_COINS_PRICE",
    "COIN_PRICE_LOOKUP",
    "SELECTED_COINS_PRICE",
    "PRICE_DETAILS",
    "COIN_PRICE_DATA"
  ],
  // eslint-disable-next-line
  validate: async (runtime, message) => {
    await validateCoingeckoConfig(runtime);
    return true;
  },
  description: "Get price and basic market data for one or more specific cryptocurrencies (by name/symbol)",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger5.log("Starting CoinGecko GET_PRICE handler...");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    try {
      elizaLogger5.log("Composing price context...");
      const priceContext = composeContext3({ state, template: getPriceTemplate });
      elizaLogger5.log("Generating content from template...");
      const result = await generateObject3({
        runtime,
        context: priceContext,
        modelClass: ModelClass3.LARGE,
        schema: GetPriceSchema
      });
      if (!isGetPriceContent(result.object)) {
        elizaLogger5.error("Invalid price request format");
        return false;
      }
      const content = result.object;
      elizaLogger5.log("Generated content:", content);
      const currencies = Array.isArray(content.currency) ? content.currency : [content.currency];
      const vs_currencies = currencies.join(",").toLowerCase();
      const coinIds = formatCoinIds(content.coinIds);
      elizaLogger5.log("Formatted request parameters:", { coinIds, vs_currencies });
      const config = await validateCoingeckoConfig(runtime);
      const { baseUrl, apiKey, headerKey } = getApiConfig(config);
      elizaLogger5.log(`Fetching prices for ${coinIds} in ${vs_currencies}...`);
      elizaLogger5.log("API request URL:", `${baseUrl}/simple/price`);
      elizaLogger5.log("API request params:", {
        ids: coinIds,
        vs_currencies,
        include_market_cap: content.include_market_cap,
        include_24hr_vol: content.include_24hr_vol,
        include_24hr_change: content.include_24hr_change,
        include_last_updated_at: content.include_last_updated_at
      });
      const response = await axios5.get(`${baseUrl}/simple/price`, {
        params: {
          ids: coinIds,
          vs_currencies,
          include_market_cap: content.include_market_cap,
          include_24hr_vol: content.include_24hr_vol,
          include_24hr_change: content.include_24hr_change,
          include_last_updated_at: content.include_last_updated_at
        },
        headers: { "accept": "application/json", [headerKey]: apiKey }
      });
      if (Object.keys(response.data).length === 0) {
        throw new Error("No price data available for the specified coins and currency");
      }
      const coins = await getCoinsData(runtime);
      const formattedResponse = Object.entries(response.data).map(([coinId, data]) => {
        const coin = coins.find((c) => c.id === coinId);
        const coinName = coin ? `${coin.name} (${coin.symbol.toUpperCase()})` : coinId;
        const parts = [coinName + ":"];
        currencies.forEach((currency) => {
          const upperCurrency = currency.toUpperCase();
          if (data[currency]) {
            parts.push(
              `  ${upperCurrency}: ${data[currency].toLocaleString(void 0, { style: "currency", currency })}`
            );
          }
          if (content.include_market_cap) {
            const marketCap = data[`${currency}_market_cap`];
            if (marketCap !== void 0) {
              parts.push(
                `  Market Cap (${upperCurrency}): ${marketCap.toLocaleString(void 0, {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 0
                })}`
              );
            }
          }
          if (content.include_24hr_vol) {
            const volume = data[`${currency}_24h_vol`];
            if (volume !== void 0) {
              parts.push(
                `  24h Volume (${upperCurrency}): ${volume.toLocaleString(void 0, { style: "currency", currency, maximumFractionDigits: 0 })}`
              );
            }
          }
          if (content.include_24hr_change) {
            const change = data[`${currency}_24h_change`];
            if (change !== void 0) {
              const changePrefix = change >= 0 ? "+" : "";
              parts.push(`  24h Change (${upperCurrency}): ${changePrefix}${change.toFixed(2)}%`);
            }
          }
        });
        if (content.include_last_updated_at && data.last_updated_at) {
          const lastUpdated = new Date(data.last_updated_at * 1e3).toLocaleString();
          parts.push(`  Last Updated: ${lastUpdated}`);
        }
        return parts.join("\n");
      }).filter(Boolean);
      if (formattedResponse.length === 0) {
        throw new Error("Failed to format price data for the specified coins");
      }
      const responseText = formattedResponse.join("\n\n");
      elizaLogger5.success("Price data retrieved successfully!");
      if (callback) {
        callback({
          text: responseText,
          content: {
            prices: Object.entries(response.data).reduce(
              (acc, [coinId, data]) => ({
                ...acc,
                [coinId]: currencies.reduce(
                  (currencyAcc, currency) => ({
                    ...currencyAcc,
                    [currency]: {
                      price: data[currency],
                      marketCap: data[`${currency}_market_cap`],
                      volume24h: data[`${currency}_24h_vol`],
                      change24h: data[`${currency}_24h_change`],
                      lastUpdated: data.last_updated_at
                    }
                  }),
                  {}
                )
              }),
              {}
            ),
            params: {
              currencies: currencies.map((c) => c.toUpperCase()),
              include_market_cap: content.include_market_cap,
              include_24hr_vol: content.include_24hr_vol,
              include_24hr_change: content.include_24hr_change,
              include_last_updated_at: content.include_last_updated_at
            }
          }
        });
      }
      return true;
    } catch (error) {
      elizaLogger5.error("Error in GET_PRICE handler:", error);
      let errorMessage;
      if (error.response?.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else if (error.response?.status === 403) {
        errorMessage = "This endpoint requires a CoinGecko Pro API key. Please upgrade your plan to access this data.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid request parameters. Please check your input.";
      }
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error.message,
            statusCode: error.response?.status,
            params: error.config?.params,
            requiresProPlan: error.response?.status === 403
          }
        });
      }
      return false;
    }
  },
  examples: [[{ user: "{{user1}}", content: { text: "What's the current price of Bitcoin?" } }, {
    user: "{{agent}}",
    content: { text: "I'll check the current Bitcoin price for you.", action: "GET_PRICE" }
  }, { user: "{{agent}}", content: { text: "The current price of Bitcoin is {{dynamic}} USD" } }], [{
    user: "{{user1}}",
    content: { text: "Check ETH and BTC prices in EUR with market cap" }
  }, {
    user: "{{agent}}",
    content: { text: "I'll check the current prices with market cap data.", action: "GET_PRICE" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Bitcoin: EUR {{dynamic}} | Market Cap: \u20AC{{dynamic}}\nEthereum: EUR {{dynamic}} | Market Cap: \u20AC{{dynamic}}"
    }
  }]]
};

// plugins/plugin-coingecko/src/actions/getPricePerAddress.ts
import { composeContext as composeContext4, elizaLogger as elizaLogger6, generateObject as generateObject4, ModelClass as ModelClass4 } from "@elizaos/core";
import axios6 from "axios";
import { z as z5 } from "zod";

// plugins/plugin-coingecko/src/templates/priceAddress.ts
var getPriceByAddressTemplate = `
Extract the following parameters for token price data:
- **chainId** (string): The blockchain network ID (e.g., "ethereum", "polygon", "binance-smart-chain")
- **tokenAddress** (string): The contract address of the token
- **include_market_cap** (boolean): Whether to include market cap data - defaults to true

Normalize chain IDs to lowercase names: ethereum, polygon, binance-smart-chain, avalanche, fantom, arbitrum, optimism, etc.
Token address should be the complete address string, maintaining its original case.

Provide the values in the following JSON format:

\`\`\`json
{
    "chainId": "ethereum",
    "tokenAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "include_market_cap": true
}
\`\`\`

Example request: "What's the price of USDC on Ethereum? Address: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
Example response:
\`\`\`json
{
    "chainId": "ethereum",
    "tokenAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "include_market_cap": true
}
\`\`\`

Example request: "Check the price for this token on Polygon: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
Example response:
\`\`\`json
{
    "chainId": "polygon",
    "tokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "include_market_cap": true
}
\`\`\`

Example request: "Get price for BONK token on Solana with address HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"
Example response:
\`\`\`json
{
    "chainId": "solana",
    "tokenAddress": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}

Based on the conversation above, use last question made and if the request is for token price data and includes both a chain and address, extract the appropriate parameters and respond with a JSON object. If the request is not related to token price data or missing required information, respond with null.`;

// plugins/plugin-coingecko/src/actions/getPricePerAddress.ts
var GetTokenPriceSchema = z5.object({ chainId: z5.string(), tokenAddress: z5.string() });
var isGetTokenPriceContent = (obj) => {
  return GetTokenPriceSchema.safeParse(obj).success;
};
var getPricePerAddress_default = {
  name: "GET_TOKEN_PRICE_BY_ADDRESS",
  similes: ["FETCH_TOKEN_PRICE_BY_ADDRESS", "CHECK_TOKEN_PRICE_BY_ADDRESS", "LOOKUP_TOKEN_BY_ADDRESS"],
  // eslint-disable-next-line
  validate: async (runtime, message) => {
    await validateCoingeckoConfig(runtime);
    return true;
  },
  description: "Get the current USD price for a token using its blockchain address",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger6.log("Starting GET_TOKEN_PRICE_BY_ADDRESS handler...");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    try {
      elizaLogger6.log("Composing token price context...");
      const context = composeContext4({ state, template: getPriceByAddressTemplate });
      elizaLogger6.log("Generating content from template...");
      const result = await generateObject4({
        runtime,
        context,
        modelClass: ModelClass4.SMALL,
        schema: GetTokenPriceSchema
      });
      if (!isGetTokenPriceContent(result.object)) {
        elizaLogger6.error("Invalid token price request format");
        return false;
      }
      const content = result.object;
      elizaLogger6.log("Generated content:", content);
      const config = await validateCoingeckoConfig(runtime);
      const { baseUrl, apiKey, headerKey } = getApiConfig(config);
      elizaLogger6.log("Fetching token data...");
      const response = await axios6.get(
        `${baseUrl}/coins/${content.chainId}/contract/${content.tokenAddress}`,
        { headers: { accept: "application/json", [headerKey]: apiKey } }
      );
      const tokenData = response.data;
      if (!tokenData.market_data?.current_price?.usd) {
        throw new Error(`No price data available for token ${content.tokenAddress} on ${content.chainId}`);
      }
      const parts = [
        `${tokenData.name} (${tokenData.symbol.toUpperCase()})`,
        `Address: ${content.tokenAddress}`,
        `Chain: ${content.chainId}`,
        `Price: $${tokenData.market_data.current_price.usd.toFixed(6)} USD`
      ];
      if (tokenData.market_data.market_cap?.usd) {
        parts.push(`Market Cap: $${tokenData.market_data.market_cap.usd.toLocaleString()} USD`);
      }
      const responseText = parts.join("\n");
      elizaLogger6.success("Token price data retrieved successfully!");
      if (callback) {
        callback({
          text: responseText,
          content: {
            token: {
              name: tokenData.name,
              symbol: tokenData.symbol,
              address: content.tokenAddress,
              chain: content.chainId,
              price: tokenData.market_data.current_price.usd,
              marketCap: tokenData.market_data.market_cap?.usd
            }
          }
        });
      }
      return true;
    } catch (error) {
      elizaLogger6.error("Error in GET_TOKEN_PRICE_BY_ADDRESS handler:", error);
      let errorMessage;
      if (error.response?.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else if (error.response?.status === 403) {
        errorMessage = "This endpoint requires a CoinGecko Pro API key. Please upgrade your plan to access this data.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid request parameters. Please check your input.";
      } else {
        errorMessage = "Failed to fetch token price. Please try again later.";
      }
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error.message,
            statusCode: error.response?.status,
            requiresProPlan: error.response?.status === 403
          }
        });
      }
      return false;
    }
  },
  examples: [[{
    user: "{{user1}}",
    content: {
      text: "What's the price of the USDC token on Ethereum? The address is 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    }
  }, {
    user: "{{agent}}",
    content: { text: "I'll check the USDC token price for you.", action: "GET_TOKEN_PRICE_BY_ADDRESS" }
  }, {
    user: "{{agent}}",
    content: {
      text: "USD Coin (USDC)\nAddress: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48\nChain: ethereum\nPrice: {{dynamic}} USD\nMarket Cap: ${{dynamic}} USD"
    }
  }]]
};

// plugins/plugin-coingecko/src/actions/getTopGainersLosers.ts
import { composeContext as composeContext5, elizaLogger as elizaLogger7, generateObject as generateObject5, ModelClass as ModelClass5 } from "@elizaos/core";
import axios7 from "axios";
import { z as z6 } from "zod";

// plugins/plugin-coingecko/src/templates/gainersLosers.ts
var getTopGainersLosersTemplate = `
Extract the following parameters for top gainers and losers data:
- **vs_currency** (string): The target currency to display prices in (e.g., "usd", "eur") - defaults to "usd"
- **duration** (string): Time range for price changes - one of "24h", "7d", "14d", "30d", "60d", "1y" - defaults to "24h"
- **top_coins** (string): Filter by market cap ranking (e.g., "100", "1000") - defaults to "1000"

Provide the values in the following JSON format:

\`\`\`json
{
    "vs_currency": "usd",
    "duration": "24h",
    "top_coins": "1000"
}
\`\`\`

Example request: "Show me the biggest gainers and losers today"
Example response:
\`\`\`json
{
    "vs_currency": "usd",
    "duration": "24h",
    "top_coins": "1000"
}
\`\`\`

Example request: "What are the top movers in EUR for the past week?"
Example response:
\`\`\`json
{
    "vs_currency": "eur",
    "duration": "7d",
    "top_coins": "300"
}
\`\`\`

Example request: "Show me monthly performance of top 100 coins"
Example response:
\`\`\`json
{
    "vs_currency": "usd",
    "duration": "30d",
    "top_coins": "100"
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}

Based on the conversation above, if the request is for top gainers and losers data, extract the appropriate parameters and respond with a JSON object. If the request is not related to top movers data, respond with null.`;

// plugins/plugin-coingecko/src/actions/getTopGainersLosers.ts
var DurationEnum = z6.enum(["1h", "24h", "7d", "14d", "30d", "60d", "1y"]);
var GetTopGainersLosersSchema = z6.object({
  vs_currency: z6.string().default("usd"),
  duration: DurationEnum.default("24h"),
  top_coins: z6.string().default("1000")
});
var isGetTopGainersLosersContent = (obj) => {
  return GetTopGainersLosersSchema.safeParse(obj).success;
};
var getTopGainersLosers_default = {
  name: "GET_TOP_GAINERS_LOSERS",
  similes: ["TOP_MOVERS", "BIGGEST_GAINERS", "BIGGEST_LOSERS", "PRICE_CHANGES", "BEST_WORST_PERFORMERS"],
  // eslint-disable-next-line
  validate: async (runtime, message) => {
    await validateCoingeckoConfig(runtime);
    return true;
  },
  description: "Get list of top gaining and losing cryptocurrencies by price change",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger7.log("Starting CoinGecko GET_TOP_GAINERS_LOSERS handler...");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    try {
      elizaLogger7.log("Composing gainers/losers context...");
      const context = composeContext5({ state, template: getTopGainersLosersTemplate });
      elizaLogger7.log("Generating content from template...");
      const result = await generateObject5({
        runtime,
        context,
        modelClass: ModelClass5.LARGE,
        schema: GetTopGainersLosersSchema
      });
      if (!isGetTopGainersLosersContent(result.object)) {
        elizaLogger7.error("Invalid gainers/losers request format");
        return false;
      }
      const content = result.object;
      elizaLogger7.log("Generated content:", content);
      const config = await validateCoingeckoConfig(runtime);
      const { baseUrl, apiKey, headerKey } = getApiConfig(config);
      elizaLogger7.log("Fetching top gainers/losers data...");
      elizaLogger7.log("API request params:", {
        vs_currency: content.vs_currency,
        duration: content.duration,
        top_coins: content.top_coins
      });
      const response = await axios7.get(`${baseUrl}/coins/top_gainers_losers`, {
        headers: { "accept": "application/json", [headerKey]: apiKey },
        params: { vs_currency: content.vs_currency, duration: content.duration, top_coins: content.top_coins }
      });
      if (!response.data) {
        throw new Error("No data received from CoinGecko API");
      }
      const responseText = [
        "Top Gainers:",
        ...response.data.top_gainers.map((coin, index) => {
          const changeKey = `usd_${content.duration}_change`;
          const change = coin[changeKey];
          return `${index + 1}. ${coin.name} (${coin.symbol.toUpperCase()}) | $${coin.usd.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} | ${change >= 0 ? "+" : ""}${change.toFixed(2)}%${coin.market_cap_rank ? ` | Rank #${coin.market_cap_rank}` : ""}`;
        }),
        "",
        "Top Losers:",
        ...response.data.top_losers.map((coin, index) => {
          const changeKey = `usd_${content.duration}_change`;
          const change = coin[changeKey];
          return `${index + 1}. ${coin.name} (${coin.symbol.toUpperCase()}) | $${coin.usd.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} | ${change >= 0 ? "+" : ""}${change.toFixed(2)}%${coin.market_cap_rank ? ` | Rank #${coin.market_cap_rank}` : ""}`;
        })
      ].join("\n");
      if (callback) {
        callback({
          text: responseText,
          content: {
            data: response.data,
            params: { vs_currency: content.vs_currency, duration: content.duration, top_coins: content.top_coins }
          }
        });
      }
      return true;
    } catch (error) {
      elizaLogger7.error("Error in GET_TOP_GAINERS_LOSERS handler:", error);
      let errorMessage;
      if (error.response?.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else if (error.response?.status === 403) {
        errorMessage = "This endpoint requires a CoinGecko Pro API key. Please upgrade your plan to access this data.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid request parameters. Please check your input.";
      } else {
        errorMessage = `Error fetching top gainers/losers data: ${error.message}`;
      }
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error.message,
            statusCode: error.response?.status,
            params: error.config?.params,
            requiresProPlan: error.response?.status === 403
          }
        });
      }
      return false;
    }
  },
  examples: [[{ user: "{{user1}}", content: { text: "What are the top gaining and losing cryptocurrencies?" } }, {
    user: "{{agent}}",
    content: { text: "I'll check the top gainers and losers for you.", action: "GET_TOP_GAINERS_LOSERS" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Here are the top gainers and losers:\nTop Gainers:\n1. Bitcoin (BTC) | $45,000 | +5.2% | Rank #1\n{{dynamic}}"
    }
  }], [{ user: "{{user1}}", content: { text: "Show me the best and worst performing crypto today" } }, {
    user: "{{agent}}",
    content: { text: "I'll fetch the current top movers in the crypto market.", action: "GET_TOP_GAINERS_LOSERS" }
  }, {
    user: "{{agent}}",
    content: { text: "Here are today's best and worst performers:\n{{dynamic}}" }
  }]]
};

// plugins/plugin-coingecko/src/actions/getTrending.ts
import { composeContext as composeContext6, elizaLogger as elizaLogger8, generateObject as generateObject6, ModelClass as ModelClass6 } from "@elizaos/core";
import axios8 from "axios";
import { z as z7 } from "zod";

// plugins/plugin-coingecko/src/templates/trending.ts
var getTrendingTemplate = `
Extract the following parameters for trending data:
- **include_nfts** (boolean): Whether to include NFTs in the response (default: true)
- **include_categories** (boolean): Whether to include categories in the response (default: true)

Provide the values in the following JSON format:

\`\`\`json
{
    "include_nfts": true,
    "include_categories": true
}
\`\`\`

Example request: "What's trending in crypto?"
Example response:
\`\`\`json
{
    "include_nfts": true,
    "include_categories": true
}
\`\`\`

Example request: "Show me trending coins only"
Example response:
\`\`\`json
{
    "include_nfts": false,
    "include_categories": false
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}

Based on the conversation above, if the request is for trending market data, extract the appropriate parameters and respond with a JSON object. If the request is not related to trending data, respond with null.`;

// plugins/plugin-coingecko/src/actions/getTrending.ts
var GetTrendingSchema = z7.object({
  include_nfts: z7.boolean().default(true),
  include_categories: z7.boolean().default(true)
});
var isGetTrendingContent = (obj) => {
  return GetTrendingSchema.safeParse(obj).success;
};
var getTrending_default = {
  name: "GET_TRENDING",
  similes: ["TRENDING_COINS", "TRENDING_CRYPTO", "HOT_COINS", "POPULAR_COINS", "TRENDING_SEARCH"],
  // eslint-disable-next-line
  validate: async (runtime, message) => {
    await validateCoingeckoConfig(runtime);
    return true;
  },
  description: "Get list of trending cryptocurrencies, NFTs, and categories from CoinGecko",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger8.log("Starting CoinGecko GET_TRENDING handler...");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    try {
      elizaLogger8.log("Composing trending context...");
      const trendingContext = composeContext6({ state, template: getTrendingTemplate });
      const result = await generateObject6({
        runtime,
        context: trendingContext,
        modelClass: ModelClass6.LARGE,
        schema: GetTrendingSchema
      });
      if (!isGetTrendingContent(result.object)) {
        elizaLogger8.error("Invalid trending request format");
        return false;
      }
      const config = await validateCoingeckoConfig(runtime);
      const { baseUrl, apiKey, headerKey } = getApiConfig(config);
      elizaLogger8.log("Fetching trending data...");
      const response = await axios8.get(`${baseUrl}/search/trending`, {
        headers: { [headerKey]: apiKey }
      });
      if (!response.data) {
        throw new Error("No data received from CoinGecko API");
      }
      const formattedData = {
        coins: response.data.coins.map(({ item }) => ({
          name: item.name,
          symbol: item.symbol.toUpperCase(),
          marketCapRank: item.market_cap_rank,
          id: item.id,
          thumbnail: item.thumb,
          largeImage: item.large
        })),
        nfts: response.data.nfts.map((nft) => ({ name: nft.name, symbol: nft.symbol, id: nft.id, thumbnail: nft.thumb })),
        categories: response.data.categories.map((category) => ({ name: category.name, id: category.id }))
      };
      const responseText = [
        "Trending Coins:",
        ...formattedData.coins.map(
          (coin, index) => `${index + 1}. ${coin.name} (${coin.symbol})${coin.marketCapRank ? ` - Rank #${coin.marketCapRank}` : ""}`
        ),
        "",
        "Trending NFTs:",
        ...formattedData.nfts.length ? formattedData.nfts.map((nft, index) => `${index + 1}. ${nft.name} (${nft.symbol})`) : ["No trending NFTs available"],
        "",
        "Trending Categories:",
        ...formattedData.categories.length ? formattedData.categories.map((category, index) => `${index + 1}. ${category.name}`) : ["No trending categories available"]
      ].join("\n");
      elizaLogger8.success("Trending data retrieved successfully!");
      if (callback) {
        callback({ text: responseText, content: { trending: formattedData, timestamp: (/* @__PURE__ */ new Date()).toISOString() } });
      }
      return true;
    } catch (error) {
      elizaLogger8.error("Error in GET_TRENDING handler:", error);
      const errorMessage = error.response?.status === 429 ? "Rate limit exceeded. Please try again later." : `Error fetching trending data: ${error.message}`;
      if (callback) {
        callback({ text: errorMessage, content: { error: error.message, statusCode: error.response?.status } });
      }
      return false;
    }
  },
  examples: [[{ user: "{{user1}}", content: { text: "What are the trending cryptocurrencies?" } }, {
    user: "{{agent}}",
    content: { text: "I'll check the trending cryptocurrencies for you.", action: "GET_TRENDING" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Here are the trending cryptocurrencies:\n1. Bitcoin (BTC) - Rank #1\n2. Ethereum (ETH) - Rank #2\n{{dynamic}}"
    }
  }], [{ user: "{{user1}}", content: { text: "Show me what's hot in crypto right now" } }, {
    user: "{{agent}}",
    content: { text: "I'll fetch the current trending cryptocurrencies.", action: "GET_TRENDING" }
  }, {
    user: "{{agent}}",
    content: { text: "Here are the trending cryptocurrencies:\n{{dynamic}}" }
  }]]
};

// plugins/plugin-coingecko/src/actions/getTrendingPools.ts
import { composeContext as composeContext7, elizaLogger as elizaLogger9, generateObject as generateObject7, ModelClass as ModelClass7 } from "@elizaos/core";
import axios9 from "axios";
import { z as z8 } from "zod";

// plugins/plugin-coingecko/src/templates/trendingPools.ts
var getTrendingPoolsTemplate = `Determine if this is a trending pools request. If it is one of the specified situations, perform the corresponding action:

Situation 1: "Get all trending pools"
- Message contains: phrases like "all trending pools", "show all pools", "list all pools"
- Example: "Show me all trending pools" or "List all pools"
- Action: Return with limit=100

Situation 2: "Get specific number of pools"
- Message contains: number followed by "pools" or "top" followed by number and "pools"
- Example: "Show top 5 pools" or "Get me 20 trending pools"
- Action: Return with limit=specified number

Situation 3: "Default trending pools request"
- Message contains: general phrases like "trending pools", "hot pools", "popular pools"
- Example: "What are the trending pools?" or "Show me hot pools"
- Action: Return with limit=10

For all situations, respond with a JSON object in the format:
\`\`\`json
{
    "limit": number
}
\`\`\`

Previous conversation for context:
{{conversation}}

You are replying to: {{message}}
`;

// plugins/plugin-coingecko/src/actions/getTrendingPools.ts
var GetTrendingPoolsSchema = z8.object({ limit: z8.number().min(1).max(100).default(10) }).strict();
var isGetTrendingPoolsContent = (obj) => {
  return GetTrendingPoolsSchema.safeParse(obj).success;
};
var getTrendingPools_default = {
  name: "GET_TRENDING_POOLS",
  similes: ["TRENDING_POOLS", "HOT_POOLS", "POPULAR_POOLS", "TOP_POOLS"],
  validate: async (runtime, _message) => {
    await validateCoingeckoConfig(runtime);
    return true;
  },
  description: "Get list of trending pools from CoinGecko's onchain data",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger9.log("Starting CoinGecko GET_TRENDING_POOLS handler...");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    try {
      elizaLogger9.log("Composing trending pools context...");
      const trendingContext = composeContext7({ state, template: getTrendingPoolsTemplate });
      const result = await generateObject7({
        runtime,
        context: trendingContext,
        modelClass: ModelClass7.LARGE,
        schema: GetTrendingPoolsSchema
      });
      if (!isGetTrendingPoolsContent(result.object)) {
        elizaLogger9.error("Invalid trending pools request format");
        return false;
      }
      const config = await validateCoingeckoConfig(runtime);
      const { baseUrl, apiKey, headerKey } = getApiConfig(config);
      elizaLogger9.log("Fetching trending pools data...");
      const response = await axios9.get(
        `${baseUrl}/onchain/networks/trending_pools?include=base_token,dex`,
        { headers: { [headerKey]: apiKey } }
      );
      if (!response.data) {
        throw new Error("No data received from CoinGecko API");
      }
      const formattedData = response.data.data.map((pool) => ({
        name: pool.attributes.name,
        marketCap: Number(pool.attributes.market_cap_usd).toLocaleString("en-US", {
          style: "currency",
          currency: "USD"
        }),
        fdv: Number(pool.attributes.fdv_usd).toLocaleString("en-US", { style: "currency", currency: "USD" }),
        reserveUSD: Number(pool.attributes.reserve_in_usd).toLocaleString("en-US", {
          style: "currency",
          currency: "USD"
        }),
        createdAt: new Date(pool.attributes.pool_created_at).toLocaleDateString()
      }));
      const responseText = [
        "Trending Pools Overview:",
        "",
        ...formattedData.map(
          (pool, index) => [
            `${index + 1}. ${pool.name}`,
            `   Market Cap: ${pool.marketCap}`,
            `   FDV: ${pool.fdv}`,
            `   Reserve: ${pool.reserveUSD}`,
            `   Created: ${pool.createdAt}`,
            ""
          ].join("\n")
        )
      ].join("\n");
      elizaLogger9.success("Trending pools data retrieved successfully!");
      if (callback) {
        callback({
          text: responseText,
          content: { trendingPools: formattedData, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      }
      return true;
    } catch (error) {
      elizaLogger9.error("Error in GET_TRENDING_POOLS handler:", error);
      const errorMessage = error.response?.status === 429 ? "Rate limit exceeded. Please try again later." : `Error fetching trending pools data: ${error.message}`;
      if (callback) {
        callback({ text: errorMessage, content: { error: error.message, statusCode: error.response?.status } });
      }
      return false;
    }
  },
  examples: [[{ user: "{{user1}}", content: { text: "Show me trending liquidity pools" } }, {
    user: "{{agent}}",
    content: { text: "I'll check the trending liquidity pools for you.", action: "GET_TRENDING_POOLS" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Here are the trending liquidity pools:\n1. MELANIA / USDC\n   Market Cap: $954,636,707\n   FDV: $6,402,478,508\n   Reserve: $363,641,037\n   Created: 1/19/2025\n2. TRUMP / USDC\n   Market Cap: $8,844,297,825\n   FDV: $43,874,068,484\n   Reserve: $718,413,745\n   Created: 1/17/2025"
    }
  }], [{ user: "{{user1}}", content: { text: "What are the top hottest dex pools?" } }, {
    user: "{{agent}}",
    content: { text: "I'll fetch the top hottest DEX pools for you.", action: "GET_TRENDING_POOLS" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Here are the top 5 hottest DEX pools:\n1. TRUMP / USDC\n   Market Cap: $8,844,297,825\n   FDV: $43,874,068,484\n   Reserve: $718,413,745\n   Created: 1/17/2025\n2. MELANIA / USDC\n   Market Cap: $954,636,707\n   FDV: $6,402,478,508\n   Reserve: $363,641,037\n   Created: 1/19/2025"
    }
  }], [{ user: "{{user1}}", content: { text: "List all trading pools with highest volume" } }, {
    user: "{{agent}}",
    content: { text: "I'll get all the trending trading pools for you.", action: "GET_TRENDING_POOLS" }
  }, {
    user: "{{agent}}",
    content: {
      text: "Here are all trending trading pools:\n1. MELANIA / USDC\n   Market Cap: $954,636,707\n   FDV: $6,402,478,508\n   Reserve: $363,641,037\n   Created: 1/19/2025\n2. TRUMP / USDC\n   Market Cap: $8,844,297,825\n   FDV: $43,874,068,484\n   Reserve: $718,413,745\n   Created: 1/17/2025"
    }
  }]]
};

// plugins/plugin-coingecko/src/index.ts
var coingeckoPlugin = {
  name: "coingecko",
  description: "CoinGecko Plugin for Eliza",
  actions: [
    getPrice_default,
    getPricePerAddress_default,
    getTrending_default,
    getTrendingPools_default,
    getMarkets_default,
    getTopGainersLosers_default,
    getNewlyListed_default
  ],
  evaluators: [],
  providers: [categoriesProvider, coinsProvider]
};

// plugins/plugin-web-search/src/actions/webSearch.ts
import { elizaLogger as elizaLogger10 } from "@elizaos/core";
import { encodingForModel } from "js-tiktoken";

// plugins/plugin-web-search/src/services/webSearchService.ts
import { Service } from "@elizaos/core";
import { tavily } from "@tavily/core";
var WebSearchService = class _WebSearchService extends Service {
  tavilyClient;
  async initialize(_runtime) {
    const apiKey = _runtime.getSetting("TAVILY_API_KEY");
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not set");
    }
    this.tavilyClient = tavily({ apiKey });
  }
  getInstance() {
    return _WebSearchService.getInstance();
  }
  static get serviceType() {
    return "web_search";
  }
  async search(query, options) {
    try {
      const response = await this.tavilyClient.search(query, {
        includeAnswer: options?.includeAnswer || true,
        maxResults: options?.limit || 3,
        topic: options?.type || "general",
        searchDepth: options?.searchDepth || "basic",
        includeImages: options?.includeImages || false,
        days: options?.days || 3
      });
      return response;
    } catch (error) {
      console.error("Web search error:", error);
      throw error;
    }
  }
};

// plugins/plugin-web-search/src/actions/webSearch.ts
var DEFAULT_MAX_WEB_SEARCH_TOKENS = 4e3;
var DEFAULT_MODEL_ENCODING = "gpt-3.5-turbo";
function getTotalTokensFromString(str, encodingName = DEFAULT_MODEL_ENCODING) {
  const encoding = encodingForModel(encodingName);
  return encoding.encode(str).length;
}
function MaxTokens(data, maxTokens = DEFAULT_MAX_WEB_SEARCH_TOKENS) {
  if (getTotalTokensFromString(data) >= maxTokens) {
    return data.slice(0, maxTokens);
  }
  return data;
}
var webSearch = {
  name: "WEB_SEARCH",
  similes: [
    "SEARCH_WEB",
    "INTERNET_SEARCH",
    "LOOKUP",
    "QUERY_WEB",
    "FIND_ONLINE",
    "SEARCH_ENGINE",
    "WEB_LOOKUP",
    "ONLINE_SEARCH",
    "FIND_INFORMATION"
  ],
  suppressInitialMessage: true,
  description: "Perform a web search to find information related to the message.",
  // eslint-disable-next-line
  validate: async (runtime, message) => {
    const tavilyApiKeyOk = !!runtime.getSetting("TAVILY_API_KEY");
    return tavilyApiKeyOk;
  },
  handler: async (runtime, message, state, options, callback) => {
    elizaLogger10.log("Composing state for message:", message);
    state = await runtime.composeState(message);
    const userId = runtime.agentId;
    elizaLogger10.log("User ID:", userId);
    const webSearchPrompt = message.content.text;
    elizaLogger10.log("web search prompt received:", webSearchPrompt);
    const webSearchService = new WebSearchService();
    await webSearchService.initialize(runtime);
    const searchResponse = await webSearchService.search(webSearchPrompt);
    if (searchResponse && searchResponse.results.length) {
      const responseList = searchResponse.answer ? `${searchResponse.answer}${Array.isArray(searchResponse.results) && searchResponse.results.length > 0 ? `

For more details, you can check out these resources:
${searchResponse.results.map(
        (result, index) => `${index + 1}. [${result.title}](${result.url})`
      ).join("\n")}` : ""}` : "";
      callback({ text: MaxTokens(responseList, DEFAULT_MAX_WEB_SEARCH_TOKENS) });
    } else {
      elizaLogger10.error("search failed or returned no data.");
    }
  },
  examples: [[{ user: "{{user1}}", content: { text: "Find the latest news about SpaceX launches." } }, {
    user: "{{agentName}}",
    content: { text: "Here is the latest news about SpaceX launches:", action: "WEB_SEARCH" }
  }], [{ user: "{{user1}}", content: { text: "Can you find details about the iPhone 16 release?" } }, {
    user: "{{agentName}}",
    content: { text: "Here are the details I found about the iPhone 16 release:", action: "WEB_SEARCH" }
  }], [{ user: "{{user1}}", content: { text: "What is the schedule for the next FIFA World Cup?" } }, {
    user: "{{agentName}}",
    content: { text: "Here is the schedule for the next FIFA World Cup:", action: "WEB_SEARCH" }
  }], [{ user: "{{user1}}", content: { text: "Check the latest stock price of Tesla." } }, {
    user: "{{agentName}}",
    content: { text: "Here is the latest stock price of Tesla I found:", action: "WEB_SEARCH" }
  }], [{ user: "{{user1}}", content: { text: "What are the current trending movies in the US?" } }, {
    user: "{{agentName}}",
    content: { text: "Here are the current trending movies in the US:", action: "WEB_SEARCH" }
  }], [{ user: "{{user1}}", content: { text: "What is the latest score in the NBA finals?" } }, {
    user: "{{agentName}}",
    content: { text: "Here is the latest score from the NBA finals:", action: "WEB_SEARCH" }
  }], [{ user: "{{user1}}", content: { text: "When is the next Apple keynote event?" } }, {
    user: "{{agentName}}",
    content: { text: "Here is the information about the next Apple keynote event:", action: "WEB_SEARCH" }
  }]]
};

// plugins/plugin-web-search/src/index.ts
var webSearchPlugin = {
  name: "webSearch",
  description: "Search the web and get news",
  actions: [webSearch],
  evaluators: [],
  providers: [],
  services: [new WebSearchService()],
  clients: []
};

// src/character.ts
var character = {
  name: "athena",
  username: "athena",
  plugins: [webSearchPlugin, coingeckoPlugin],
  clients: [Clients.DISCORD],
  modelProvider: ModelProviderName.OPENAI,
  settings: { secrets: {}, voice: { model: "en_US-male-medium" } },
  bio: ["Always ready to lend a helping hand to creators, gamers, and enthusiasts in the blockchain gaming space."],
  lore: [
    "Dedicated to assisting gamers, developers, and creators, athena thrives on building connections and spreading knowledge."
  ],
  knowledge: [
    "Crypto-native gaming ecosystems and their unique dynamics",
    "Building strong and inclusive gaming communities",
    "Classic and modern games loved by gamers across generations",
    "The technical and creative aspects of game development",
    "Blockchain technology and its role in revolutionizing gaming"
  ],
  style: {
    all: ["friendly", "community-oriented", "supportive"],
    chat: ["approachable", "kind", "encouraging"],
    post: ["informative", "engaging", "inclusive"]
  },
  adjectives: ["friendly", "helpful", "kind", "engaging", "community-focused", "knowledgeable"],
  messageExamples: [[{ user: "athena", content: { text: "" } }, {
    user: "User",
    content: { text: "Can you tell me about the Adjutant programmatic WL?" }
  }, { user: "athena", content: { text: "" } }], [{ user: "athena", content: { text: "" } }, {
    user: "User",
    content: { text: "That's great! Where can I learn more?" }
  }, {
    user: "athena",
    content: { text: "Check out our website or hop into the Discord community for all the latest updates!" }
  }]],
  postExamples: [],
  topics: [
    "Community building in gaming",
    "Blockchain technology in gaming",
    "Empowering creators and developers",
    "Classic and modern gaming cultures"
  ]
};

// src/chat/index.ts
import { settings } from "@elizaos/core";
import readline from "readline";
var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("SIGINT", () => {
  rl.close();
  process.exit(0);
});
async function handleUserInput(input, agentId) {
  if (input.toLowerCase() === "exit") {
    rl.close();
    process.exit(0);
  }
  try {
    const serverPort = parseInt(settings.SERVER_PORT || "3000");
    const response = await fetch(`http://localhost:${serverPort}/${agentId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input, userId: "user", userName: "User" })
    });
    const data = await response.json();
    data.forEach((message) => console.log(`${"Agent"}: ${message.text}`));
  } catch (error) {
    console.error("Error fetching response:", error);
  }
}
function startChat(characters) {
  function chat() {
    const agentId = characters[0].name ?? "Agent";
    rl.question("You: ", async (input) => {
      await handleUserInput(input, agentId);
      if (input.toLowerCase() !== "exit") {
        chat();
      }
    });
  }
  return chat;
}

// src/clients/index.ts
import { AutoClientInterface } from "@elizaos/client-auto";
import { DiscordClientInterface } from "@elizaos/client-discord";
import { TwitterClientInterface } from "@elizaos/client-twitter";
async function initializeClients(character2, runtime) {
  const clients = [];
  const clientTypes = character2.clients?.map((str) => str.toLowerCase()) || [];
  if (clientTypes.includes("auto")) {
    const autoClient = await AutoClientInterface.start(runtime);
    if (autoClient) clients.push(autoClient);
  }
  if (clientTypes.includes("discord")) {
    clients.push(await DiscordClientInterface.start(runtime));
  }
  if (clientTypes.includes("twitter")) {
    const twitterClients = await TwitterClientInterface.start(runtime);
    clients.push(twitterClients);
  }
  if (character2.plugins?.length > 0) {
    for (const plugin of character2.plugins) {
      if (plugin.clients) {
        for (const client of plugin.clients) {
          clients.push(await client.start(runtime));
        }
      }
    }
  }
  return clients;
}

// src/config/index.ts
import { ModelProviderName as ModelProviderName2, settings as settings2, validateCharacterConfig } from "@elizaos/core";
import fs from "fs";
import path from "path";
import yargs from "yargs";
function parseArguments() {
  try {
    return yargs(process.argv.slice(2)).option("character", {
      type: "string",
      description: "Path to the character JSON file"
    }).option("characters", { type: "string", description: "Comma separated list of paths to character JSON files" }).parseSync();
  } catch (error) {
    console.error("Error parsing arguments:", error);
    return {};
  }
}
async function loadCharacters(charactersArg) {
  let characterPaths = charactersArg?.split(",").map((filePath) => {
    if (path.basename(filePath) === filePath) {
      filePath = "../characters/" + filePath;
    }
    return path.resolve(process.cwd(), filePath.trim());
  });
  const loadedCharacters = [];
  if (characterPaths?.length > 0) {
    for (const path4 of characterPaths) {
      try {
        const character2 = JSON.parse(fs.readFileSync(path4, "utf8"));
        validateCharacterConfig(character2);
        loadedCharacters.push(character2);
      } catch (e) {
        console.error(`Error loading character from ${path4}: ${e}`);
        process.exit(1);
      }
    }
  }
  return loadedCharacters;
}
function getTokenForProvider(provider, character2) {
  switch (provider) {
    // no key needed for llama_local or gaianet
    case ModelProviderName2.LLAMALOCAL:
      return "";
    case ModelProviderName2.OLLAMA:
      return "";
    case ModelProviderName2.GAIANET:
      return "";
    case ModelProviderName2.OPENAI:
      return character2.settings?.secrets?.OPENAI_API_KEY || settings2.OPENAI_API_KEY;
    case ModelProviderName2.LLAMACLOUD:
      return character2.settings?.secrets?.LLAMACLOUD_API_KEY || settings2.LLAMACLOUD_API_KEY || character2.settings?.secrets?.TOGETHER_API_KEY || settings2.TOGETHER_API_KEY || character2.settings?.secrets?.XAI_API_KEY || settings2.XAI_API_KEY || character2.settings?.secrets?.OPENAI_API_KEY || settings2.OPENAI_API_KEY;
    case ModelProviderName2.ANTHROPIC:
      return character2.settings?.secrets?.ANTHROPIC_API_KEY || character2.settings?.secrets?.CLAUDE_API_KEY || settings2.ANTHROPIC_API_KEY || settings2.CLAUDE_API_KEY;
    case ModelProviderName2.OPENROUTER:
      return character2.settings?.secrets?.OPENROUTER || settings2.OPENROUTER_API_KEY;
    case ModelProviderName2.OPENROUTER:
      return character2.settings?.secrets?.OPENROUTER_API_KEY || settings2.OPENROUTER_API_KEY;
    case ModelProviderName2.GROK:
      return character2.settings?.secrets?.GROK_API_KEY || settings2.GROK_API_KEY;
    case ModelProviderName2.HEURIST:
      return character2.settings?.secrets?.HEURIST_API_KEY || settings2.HEURIST_API_KEY;
    case ModelProviderName2.HEURIST:
      return character2.settings?.secrets?.HEURIST_API_KEY || settings2.HEURIST_API_KEY;
    case ModelProviderName2.GROQ:
      return character2.settings?.secrets?.GROQ_API_KEY || settings2.GROQ_API_KEY;
    case ModelProviderName2.VENICE:
      return character2.settings?.secrets?.VENICE_API_KEY || settings2.VENICE_API_KEY;
    case ModelProviderName2.AKASH_CHAT_API:
      return character2.settings?.secrets?.AKASH_CHAT_API_KEY || settings2.AKASH_CHAT_API_KEY;
    case ModelProviderName2.GOOGLE:
      return character2.settings?.secrets?.GOOGLE_GENERATIVE_AI_API_KEY || settings2.GOOGLE_GENERATIVE_AI_API_KEY;
    case ModelProviderName2.FAL:
      return character2.settings?.secrets?.FAL_API_KEY || settings2.FAL_API_KEY;
    case ModelProviderName2.ETERNALAI:
      return character2.settings?.secrets?.ETERNALAI_API_KEY || settings2.ETERNALAI_API_KEY;
  }
}

// src/database/index.ts
import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import path2 from "path";
function initializeDatabase(dataDir) {
  if (process.env.POSTGRES_URL) {
    const db = new PostgresDatabaseAdapter({ connectionString: process.env.POSTGRES_URL });
    return db;
  } else {
    const filePath = process.env.SQLITE_FILE ?? path2.resolve(dataDir, "db.sqlite");
    const db = new SqliteDatabaseAdapter(new Database(filePath));
    return db;
  }
}

// src/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var wait = (minTime = 1e3, maxTime = 3e3) => {
  const waitTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};
var nodePlugin;
function createAgent(character2, db, cache, token) {
  elizaLogger11.success(elizaLogger11.successesTitle, "Creating runtime for character", character2.name);
  nodePlugin ??= createNodePlugin();
  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character2.modelProvider,
    evaluators: [],
    character: character2,
    plugins: [bootstrapPlugin, nodePlugin, character2.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null].filter(
      Boolean
    ),
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache
  });
}
async function startAgent(character2, directClient) {
  try {
    character2.id ??= stringToUuid(character2.name);
    character2.username ??= character2.name;
    const token = getTokenForProvider(character2.modelProvider, character2);
    const dataDir = path3.join(__dirname, "../data");
    if (!fs2.existsSync(dataDir)) {
      fs2.mkdirSync(dataDir, { recursive: true });
    }
    const db = initializeDatabase(dataDir);
    await db.init();
    const cache = initializeDbCache(character2, db);
    const runtime = createAgent(character2, db, cache, token);
    await runtime.initialize();
    runtime.clients = await initializeClients(character2, runtime);
    directClient.registerAgent(runtime);
    elizaLogger11.debug(`Started ${character2.name} as ${runtime.agentId}`);
    return runtime;
  } catch (error) {
    elizaLogger11.error(`Error starting agent for character ${character2.name}:`, error);
    console.error(error);
    throw error;
  }
}
var checkPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
};
var startAgents = async () => {
  const directClient = new DirectClient();
  let serverPort = parseInt(settings3.SERVER_PORT || "3000");
  const args = parseArguments();
  let charactersArg = args.characters || args.character;
  let characters = [character];
  console.log("charactersArg", charactersArg);
  if (charactersArg) {
    characters = await loadCharacters(charactersArg);
  }
  console.log("characters", characters);
  try {
    for (const character2 of characters) {
      await startAgent(character2, directClient);
    }
  } catch (error) {
    elizaLogger11.error("Error starting agents:", error);
  }
  while (!await checkPortAvailable(serverPort)) {
    elizaLogger11.warn(`Port ${serverPort} is in use, trying ${serverPort + 1}`);
    serverPort++;
  }
  directClient.startAgent = async (character2) => {
    return startAgent(character2, directClient);
  };
  directClient.start(serverPort);
  if (serverPort !== parseInt(settings3.SERVER_PORT || "3000")) {
    elizaLogger11.log(`Server started on alternate port ${serverPort}`);
  }
  const isDaemonProcess = process.env.DAEMON_PROCESS === "true";
  if (!isDaemonProcess) {
    elizaLogger11.log("Chat started. Type 'exit' to quit.");
    const chat = startChat(characters);
    chat();
  }
};
startAgents().catch((error) => {
  elizaLogger11.error("Unhandled error in startAgents:", error);
  process.exit(1);
});
export {
  createAgent,
  wait
};
