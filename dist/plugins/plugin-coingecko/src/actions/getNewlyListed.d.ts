import { type Action, type Content } from '@elizaos/core';
import { z } from 'zod';
export declare const GetNewCoinsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
}, {
    limit?: number;
}>;
export type GetNewCoinsContent = z.infer<typeof GetNewCoinsSchema> & Content;
export declare const isGetNewCoinsContent: (obj: any) => obj is GetNewCoinsContent;
declare const _default: Action;
export default _default;
