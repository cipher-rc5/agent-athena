import { type Action, type Content } from '@elizaos/core';
import { z } from 'zod';
export declare const GetPriceSchema: z.ZodObject<{
    coinIds: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    currency: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    include_market_cap: z.ZodDefault<z.ZodBoolean>;
    include_24hr_vol: z.ZodDefault<z.ZodBoolean>;
    include_24hr_change: z.ZodDefault<z.ZodBoolean>;
    include_last_updated_at: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    coinIds?: string | string[];
    currency?: string | string[];
    include_market_cap?: boolean;
    include_24hr_vol?: boolean;
    include_24hr_change?: boolean;
    include_last_updated_at?: boolean;
}, {
    coinIds?: string | string[];
    currency?: string | string[];
    include_market_cap?: boolean;
    include_24hr_vol?: boolean;
    include_24hr_change?: boolean;
    include_last_updated_at?: boolean;
}>;
export type GetPriceContent = z.infer<typeof GetPriceSchema> & Content;
export declare const isGetPriceContent: (obj: any) => obj is GetPriceContent;
declare const _default: Action;
export default _default;
