import { type Action, type Content } from '@elizaos/core';
import { z } from 'zod';
export declare const GetTopGainersLosersSchema: z.ZodObject<{
    vs_currency: z.ZodDefault<z.ZodString>;
    duration: z.ZodDefault<z.ZodEnum<["1h", "24h", "7d", "14d", "30d", "60d", "1y"]>>;
    top_coins: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    vs_currency?: string;
    duration?: "1h" | "24h" | "7d" | "14d" | "30d" | "60d" | "1y";
    top_coins?: string;
}, {
    vs_currency?: string;
    duration?: "1h" | "24h" | "7d" | "14d" | "30d" | "60d" | "1y";
    top_coins?: string;
}>;
export type GetTopGainersLosersContent = z.infer<typeof GetTopGainersLosersSchema> & Content;
export declare const isGetTopGainersLosersContent: (obj: any) => obj is GetTopGainersLosersContent;
declare const _default: Action;
export default _default;
