# Cipher Unit Testing Notes

## Coingecko Pro API Plugin

Unit is operational but observing obscure axios error on data fetch, consider replacing axios dependency with native fetch instead; instance appears corrected by including relevant `COINGECKO_PRO_API_KEY` and `COINGECKO_API_KEY` environment variables.

```log
⛔ ERRORS
  Categories fetch attempt 1 failed: 
  {"message":"Request failed with status code 400","name":"AxiosError","stack":"AxiosError: Request failed with status code 400\n    at settle (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/node_modules/.pnpm/axios@1.7.9/node_modules/axios/lib/core/settle.js:19:12)\n    at Unzip.handleStreamEnd (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/node_modules/.pnpm/axios@1.7.9/node_modules/axios/lib/adapters/http.js:599:11)\n    at Unzip.emit (node:events:525:35)\n    at endReadableNT (node:internal/streams/readable:1696:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)\n    at Axios.request (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/node_modules/.pnpm/axios@1.7.9/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async fetchCategories (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/plugins/plugin-coingecko/src/providers/categoriesProvider.ts:11:22)\n    at async fetchWithRetry (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/plugins/plugin-coingecko/src/providers/categoriesProvider.ts:24:20)\n    at async getCategories (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/plugins/plugin-coingecko/src/providers/categoriesProvider.ts:42:28)\n    at async Object.get (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/plugins/plugin-coingecko/src/providers/categoriesProvider.ts:78:32)\n    at async file:///Users/cipher009/Desktop/testing/discord-twitter-agent/node_modules/.pnpm/@elizaos+core@0.1.7_@google-cloud+vertexai@1.9.3_@langchain+core@0.3.37_openai@4.73.0_z_6a0c9b5e63484f96d4fa56ab3cf617f2/node_modules/@elizaos/core/dist/index.js:31414:14\n    at async Promise.all (index 0)\n    at async getProviders (file:///Users/cipher009/Desktop/testing/discord-twitter-agent/node_modules/.pnpm/@elizaos+core@0.1.7_@google-cloud+vertexai@1.9.3_@langchain+core@0.3.37_openai@4.73.0_z_6a0c9b5e63484f96d4fa56ab3cf617f2/node_modules/@elizaos/core/dist/index.js:31412:28)\n    at async Promise.all (index 2)","config":{"transitional":{"silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false},"adapter":["xhr","http","fetch"],"transformRequest":[null],"transformResponse":[null],"timeout":5000,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,"env":{},"headers":{"Accept":"application/json","x-cg-demo-api-key":"CG-ooTXzVaVYcjdphWsTBcqDRze","User-Agent":"axios/1.7.9","Accept-Encoding":"gzip, compress, deflate, br"},"method":"get","url":"https://api.coingecko.com/api/v3/coins/categories/list"},"code":"ERR_BAD_REQUEST","status":400}
```

## Easy to Fix Eliza Error

if encountering better-sqlite3 error on unit initialization simply rebuild the node_module

error

```json
⛔ ERRORS
   Error starting agents: 
   {"tries":["/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/build/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/build/Debug/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/out/Debug/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/Debug/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/out/Release/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/Release/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/build/default/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/compiled/23.4.0/darwin/arm64/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/addon-build/release/install-root/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/addon-build/debug/install-root/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/addon-build/default/install-root/better_sqlite3.node","/Users/cipher009/Desktop/ai-agents/agent-athena/node_modules/.pnpm/better-sqlite3@11.5.0/node_modules/better-sqlite3/lib/binding/node-v131-darwin-arm64/better_sqlite3.node"]}
```

fix

```sh
cd node_modules/better-sqlite3 && pnpm rebuild && cd ../.. && pnpm build && pnpm start
```
