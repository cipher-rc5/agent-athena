import { type Action, type Content } from '@elizaos/core';
import { z } from 'zod';
export declare const GetTrendingPoolsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    limit?: number;
}, {
    limit?: number;
}>;
export type GetTrendingPoolsContent = z.infer<typeof GetTrendingPoolsSchema> & Content;
export declare const isGetTrendingPoolsContent: (obj: any) => obj is GetTrendingPoolsContent;
declare const _default: Action;
export default _default;
