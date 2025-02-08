import { type Action, type Content } from '@elizaos/core';
import { z } from 'zod';
interface CategoryItem {
    category_id: string;
    name: string;
}
export declare function formatCategory(category: string | undefined, categories: CategoryItem[]): string | undefined;
/**
 * Interface for CoinGecko /coins/markets endpoint response
 * @see https://docs.coingecko.com/reference/coins-markets
 */
export interface CoinMarketData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    last_updated: string;
}
export declare const GetMarketsSchema: z.ZodObject<{
    vs_currency: z.ZodDefault<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    order: z.ZodDefault<z.ZodEnum<["market_cap_desc", "market_cap_asc", "volume_desc", "volume_asc"]>>;
    per_page: z.ZodDefault<z.ZodNumber>;
    page: z.ZodDefault<z.ZodNumber>;
    sparkline: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    vs_currency?: string;
    category?: string;
    order?: "market_cap_desc" | "market_cap_asc" | "volume_desc" | "volume_asc";
    per_page?: number;
    page?: number;
    sparkline?: boolean;
}, {
    vs_currency?: string;
    category?: string;
    order?: "market_cap_desc" | "market_cap_asc" | "volume_desc" | "volume_asc";
    per_page?: number;
    page?: number;
    sparkline?: boolean;
}>;
export type GetMarketsContent = z.infer<typeof GetMarketsSchema> & Content;
export declare const isGetMarketsContent: (obj: any) => obj is GetMarketsContent;
declare const _default: Action;
export default _default;
