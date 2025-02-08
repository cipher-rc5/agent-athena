export declare const getPriceByAddressTemplate = "\nExtract the following parameters for token price data:\n- **chainId** (string): The blockchain network ID (e.g., \"ethereum\", \"polygon\", \"binance-smart-chain\")\n- **tokenAddress** (string): The contract address of the token\n- **include_market_cap** (boolean): Whether to include market cap data - defaults to true\n\nNormalize chain IDs to lowercase names: ethereum, polygon, binance-smart-chain, avalanche, fantom, arbitrum, optimism, etc.\nToken address should be the complete address string, maintaining its original case.\n\nProvide the values in the following JSON format:\n\n```json\n{\n    \"chainId\": \"ethereum\",\n    \"tokenAddress\": \"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48\",\n    \"include_market_cap\": true\n}\n```\n\nExample request: \"What's the price of USDC on Ethereum? Address: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48\"\nExample response:\n```json\n{\n    \"chainId\": \"ethereum\",\n    \"tokenAddress\": \"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48\",\n    \"include_market_cap\": true\n}\n```\n\nExample request: \"Check the price for this token on Polygon: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174\"\nExample response:\n```json\n{\n    \"chainId\": \"polygon\",\n    \"tokenAddress\": \"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174\",\n    \"include_market_cap\": true\n}\n```\n\nExample request: \"Get price for BONK token on Solana with address HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC\"\nExample response:\n```json\n{\n    \"chainId\": \"solana\",\n    \"tokenAddress\": \"HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC\"\n}\n```\n\nHere are the recent user messages for context:\n{{recentMessages}}\n\nBased on the conversation above, use last question made and if the request is for token price data and includes both a chain and address, extract the appropriate parameters and respond with a JSON object. If the request is not related to token price data or missing required information, respond with null.";
