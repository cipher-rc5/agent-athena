export declare const getMarketsTemplate = "\nExtract the following parameters for market listing:\n- **vs_currency** (string): Target currency for price data (default: \"usd\")\n- **category** (string, optional): Specific category ID from the available categories\n- **per_page** (number): Number of results to return (1-250, default: 20)\n- **order** (string): Sort order for results, one of:\n  - market_cap_desc: Highest market cap first\n  - market_cap_asc: Lowest market cap first\n  - volume_desc: Highest volume first\n  - volume_asc: Lowest volume first\n\nAvailable Categories:\n{{categories}}\n\nProvide the values in the following JSON format:\n\n```json\n{\n    \"vs_currency\": \"<currency>\",\n    \"category\": \"<category_id>\",\n    \"per_page\": <number>,\n    \"order\": \"<sort_order>\",\n    \"page\": 1,\n    \"sparkline\": false\n}\n```\n\nExample request: \"Show me the top 10 gaming cryptocurrencies\"\nExample response:\n```json\n{\n    \"vs_currency\": \"usd\",\n    \"category\": \"gaming\",\n    \"per_page\": 10,\n    \"order\": \"market_cap_desc\",\n    \"page\": 1,\n    \"sparkline\": false\n}\n```\n\nExample request: \"What are the best performing coins by volume?\"\nExample response:\n```json\n{\n    \"vs_currency\": \"usd\",\n    \"per_page\": 20,\n    \"order\": \"volume_desc\",\n    \"page\": 1,\n    \"sparkline\": false\n}\n```\n\nHere are the recent user messages for context:\n{{recentMessages}}\n\nBased on the conversation above, if the request is for a market listing/ranking, extract the appropriate parameters and respond with a JSON object. If the request is for specific coins only, respond with null.";
