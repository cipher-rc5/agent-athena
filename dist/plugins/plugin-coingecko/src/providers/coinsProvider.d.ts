import { type IAgentRuntime, type Provider } from '@elizaos/core';
interface CoinItem {
    id: string;
    symbol: string;
    name: string;
}
export declare const coinsProvider: Provider;
export declare function getCoinsData(runtime: IAgentRuntime, includePlatform?: boolean): Promise<CoinItem[]>;
export {};
