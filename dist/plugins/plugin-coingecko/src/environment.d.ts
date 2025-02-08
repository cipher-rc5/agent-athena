import type { IAgentRuntime } from '@elizaos/core';
import { z } from 'zod';
declare const coingeckoConfigSchema: z.ZodEffects<z.ZodObject<{
    COINGECKO_API_KEY: z.ZodNullable<z.ZodString>;
    COINGECKO_PRO_API_KEY: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    COINGECKO_API_KEY?: string;
    COINGECKO_PRO_API_KEY?: string;
}, {
    COINGECKO_API_KEY?: string;
    COINGECKO_PRO_API_KEY?: string;
}>, {
    COINGECKO_API_KEY?: string;
    COINGECKO_PRO_API_KEY?: string;
}, {
    COINGECKO_API_KEY?: string;
    COINGECKO_PRO_API_KEY?: string;
}>;
export type CoingeckoConfig = z.infer<typeof coingeckoConfigSchema>;
export declare function validateCoingeckoConfig(runtime: IAgentRuntime): Promise<CoingeckoConfig>;
export declare function getApiConfig(config: CoingeckoConfig): {
    baseUrl: string;
    apiKey: string;
    headerKey: string;
};
export {};
