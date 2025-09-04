import * as pluralize from "pluralize";
import { faker } from "@faker-js/faker";
import { DatterNode } from './types';

export class DataGenerator {

    constructor(private nodes: DatterNode[]) {}

    public async generate(count = 1): Promise<Record<string, any[]>> {
        const result: Record<string, any[]> = {};

        for (const node of this.nodes) {
            const collectionName = this.formatCollectionName(node.name);
            result[collectionName] = [];
            for (let i = 0; i < count; i++) {
                result[collectionName].push(await this.generateMock(node));
            }
        }

        return result;
    }

    private async generateMock(node: DatterNode): Promise<any> {
        switch (node.type) {
            case "string":
                return this.generateData<string>(node, this.stringHints, faker.lorem.word());
            case "number":
                return this.generateData<number>(node, this.numberHints, faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }));
            case "boolean":
                return faker.datatype.boolean();
            case "date":
                return this.generateData<Date>(node, this.dateHints, faker.date.recent());
            case "enum":
                return faker.helpers.arrayElement(node.enumValues || []);
            case "array":
                const length = faker.number.int({ min: 1, max: 5 });
                const arr = [];

                for (let i = 0; i < length; i++) {
                    arr.push(await this.generateMock(node.arrayType!));
                }

                return arr;
            case "object":
                const obj: any = {};

                for (const child of node.children || []) {
                    obj[child.name] = await this.generateMock(child);
                }

                return obj;
            default:
                return null;
        }
    }

    // use heuristics to identify the correct data type
    private generateData<T>(node: DatterNode, hints: Array<[RegExp, () => T]>, fallback: T) {
        const lowerName = node.name.toLowerCase();

        for (const [re, fn] of hints) {
            if (re.test(lowerName)) {
                return fn();
            }
        }

        return fallback;
    }

    private formatCollectionName(name: string): string {
       return pluralize(name.charAt(0).toLowerCase() + name.slice(1));
    }

    private stringHints: Array<[RegExp, () => string]> = [
        [/email/i, () => faker.internet.email()],
        [/(first[-_ ]?name|fname)/i, () => faker.person.firstName()],
        [/(last[-_ ]?name|lname|surname|family)/i, () => faker.person.lastName()],
        [/(full[-_ ]?name|name)/i, () => faker.person.fullName()],
        [/(phone|mobile|tel)/i, () => faker.phone.number()],
        [/uuid|guid|id$/i, () => faker.string.uuid()],
        [/(url|uri|link)/i, () => faker.internet.url()],
        [/username/i, () => faker.internet.username()],
        [/password/i, () => faker.internet.password()],
        [/(avatar|image|img)/i, () => faker.image.url()],
        [/address/i, () => faker.location.streetAddress()],
        [/(city|town)/i, () => faker.location.city()],
        [/(zip|postal)/i, () => faker.location.zipCode()],
        [/(country)/i, () => faker.location.country()],
        [/(lat|latitude)/i, () => faker.location.latitude().toString()],
        [/(lng|longitude)/i, () => faker.location.longitude().toString()],
        [/(createdAt|created|created_at)/i, () => faker.date.past().toISOString()],
        [/(updatedAt|updated|updated_at)/i, () => faker.date.recent().toISOString()],
        [/(joinedAt|joined|joined_at)/i, () => faker.date.recent().toISOString()],
        [/(deletedAt|deleted|deleted_at)/i, () => faker.date.recent().toISOString()],
        [/(comment|description|text)/i, () => faker.lorem.text()],
    ];

    private numberHints: Array<[RegExp, () => number]> = [
        [/(lat|latitude)/i, () => faker.location.latitude()],
        [/(lng|longitude)/i, () => faker.location.longitude()],
        [/(age)/i, () => faker.number.int({ min: 18, max: 85 })]
    ];

    private dateHints: Array<[RegExp, () => Date]> = [
        [/(createdAt|created|created_at)/i, () => faker.date.past()],
        [/(updatedAt|updated|updated_at)/i, () => faker.date.recent()],
        [/(joinedAt|joined|joined_at)/i, () => faker.date.recent()],
        [/(deletedAt|deleted|deleted_at)/i, () => faker.date.recent()],
        [/(due)/i, () => faker.date.future()],
    ];
}
