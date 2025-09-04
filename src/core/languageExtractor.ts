import { DatterNode } from "./types";

export interface ILanguageExtractor {
    parseFile(): Promise<DatterNode[]>;
    parseSelection(selection: string): Promise<DatterNode[]>;
}