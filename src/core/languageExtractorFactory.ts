import { TypeScriptExtractor } from "../languages";
import { ILanguageExtractor } from "./languageExtractor";

type LanguageExtractorFactoryConstructor = new () => ILanguageExtractor;

export class LanguageExtractorFactory {
    private static generators = new Map<string, LanguageExtractorFactoryConstructor>();

    public static register(language: string, constructor: LanguageExtractorFactoryConstructor): void {
        this.generators.set(language, constructor);
    }

    public static createExtractorFor(language: string): ILanguageExtractor {
        const Extractor = this.generators.get(language.toLowerCase());

        if(!Extractor) {
            throw new Error(`Unsupported language: ${language}`);
        }

        return new Extractor();
    }
}

LanguageExtractorFactory.register("typescript", TypeScriptExtractor);
LanguageExtractorFactory.register("typescriptreact", TypeScriptExtractor);