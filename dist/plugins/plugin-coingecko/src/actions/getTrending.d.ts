import { type Action, type Content } from '@elizaos/core';
import { z } from 'zod';
export declare const GetTrendingSchema: z.ZodObject<{
    include_nfts: z.ZodDefault<z.ZodBoolean>;
    include_categories: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    include_nfts?: boolean;
    include_categories?: boolean;
}, {
    include_nfts?: boolean;
    include_categories?: boolean;
}>;
export type GetTrendingContent = z.infer<typeof GetTrendingSchema> & Content;
export declare const isGetTrendingContent: (obj: any) => obj is GetTrendingContent;
declare const _default: Action;
export default _default;
