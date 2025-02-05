// plugins/plugin-coingecko/src/index.ts

import type { Plugin } from '@elizaos/core';
import getMarkets from './actions/getMarkets.ts';
import getNewlyListed from './actions/getNewlyListed.ts';
import getPrice from './actions/getPrice.ts';
import getPricePerAddress from './actions/getPricePerAddress.ts';
import getTopGainersLosers from './actions/getTopGainersLosers.ts';
import getTrending from './actions/getTrending.ts';
import getTrendingPools from './actions/getTrendingPools.ts';
import { categoriesProvider } from './providers/categoriesProvider.ts';
import { coinsProvider } from './providers/coinsProvider.ts';

export const coingeckoPlugin: Plugin = {
  name: 'coingecko',
  description: 'CoinGecko Plugin for Eliza',
  actions: [
    getPrice,
    getPricePerAddress,
    getTrending,
    getTrendingPools,
    getMarkets,
    getTopGainersLosers,
    getNewlyListed
  ],
  evaluators: [],
  providers: [categoriesProvider, coinsProvider]
};

export default coingeckoPlugin;
