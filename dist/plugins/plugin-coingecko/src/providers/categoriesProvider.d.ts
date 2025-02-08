import { type IAgentRuntime, type Provider } from '@elizaos/core';
interface CategoryItem {
    category_id: string;
    name: string;
}
export declare const categoriesProvider: Provider;
export declare function getCategoriesData(runtime: IAgentRuntime): Promise<CategoryItem[]>;
export {};
