import { type Action, type Content } from '@elizaos/core';
import { z } from 'zod';
export declare const GetTokenPriceSchema: z.ZodObject<{
    chainId: z.ZodString;
    tokenAddress: z.ZodString;
}, "strip", z.ZodTypeAny, {
    chainId?: string;
    tokenAddress?: string;
}, {
    chainId?: string;
    tokenAddress?: string;
}>;
export type GetTokenPriceContent = z.infer<typeof GetTokenPriceSchema> & Content;
export declare const isGetTokenPriceContent: (obj: any) => obj is GetTokenPriceContent;
declare const _default: Action;
export default _default;
