import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { 
    InterfaceDeclaration, 
    JSDoc, 
    JSDocTag, 
    Project, 
    PropertySignature, 
    Type
} from "ts-morph";
import { ILanguageExtractor, DatterNode } from "../../core";


export class TypeScriptExtractor implements ILanguageExtractor {
    private project: Project;

    constructor() {
		this.project = new Project({
			tsConfigFilePath: this.getTsConfig(),
		});

		const currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;

		if(!currentFile) {
			throw new Error("Attempted to datter with no file active.");
		}

		// this.sourceFile = this.project.getSourceFileOrThrow(currentFile);
	}

	private getTsConfig(): string {
		const editor = vscode.window.activeTextEditor;

		if(!editor) {
			throw new Error("Attempted to datter with no active text editor.");
		}

		const fileUri = editor.document.uri;
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

        if(workspaceFolder) {
    		return `${workspaceFolder.uri.fsPath}/tsconfig.json`;
        }

        const tsConfig = this.findTsConfig(fileUri.fsPath);

        if(!tsConfig) {
            throw new Error(`tsconfig.json could not be found for ${editor.document.fileName}`);
        }

		return tsConfig;
	}

    private findTsConfig(startPath: string): string | null {
        let currentDir = path.dirname(startPath);

        while (true) {
            const tsConfigPath = path.join(currentDir, 'tsconfig.json');
            
            if (fs.existsSync(tsConfigPath)) {
                return tsConfigPath;
            }

            const parentDir = path.dirname(currentDir);

            if (parentDir === currentDir) {
                return null;
            }

            currentDir = parentDir;
        }
    }

	async parseFile(): Promise<DatterNode[]> {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            return [];
        }

        const document = editor.document;
        const file = this.project.addSourceFileAtPath(document.uri.fsPath);

        const allNodes: DatterNode[] = [];

        file.getInterfaces().forEach(i => {
            allNodes.push(this.extractFromInterface(i));
        });

        file.getTypeAliases().forEach(t => {
            allNodes.push(...this.extractFromTypeAlias(t));
        });

        return allNodes;
    }


	parseSelection(selection: string): Promise<DatterNode[]> {
		throw new Error("Method not implemented.");
	}

    private extractFromInterface(_interface: InterfaceDeclaration): DatterNode {
        const properties = _interface.getProperties();
        const children: DatterNode[] = [];

        properties.forEach((property: PropertySignature) => {
            const name = property.getName();
            const type = property.getType();
            const jsDocs = property.getJsDocs();
            const datterHint = this.parseDatterHint(jsDocs);
            const datterNode = this.resolveType(type, name);

            if (datterNode) {
                datterNode.datterHint = datterHint;
                children.push(datterNode);
            }
        });

        return {
            name: _interface.getName(),
            type: "object",
            isOptional: false,
            originalType: _interface.getName(),
            children
        };
    }


    private extractFromTypeAlias(alias: any): DatterNode[] {
        const type = alias.getType();
        return [this.resolveType(type, alias.getName())].filter(Boolean) as DatterNode[];
    }

    private parseDatterHint(jsDocs: JSDoc[]): string | undefined {
        for (const doc of jsDocs) {
            const tag = doc.getTags().find((tag: JSDocTag) => tag.getTagName() === "datter");

            if (tag) {
				return tag.getComment() as string;
			}
        }

        return undefined;
    }

    private resolveType(type: Type, name: string): DatterNode | undefined {
        const originalType = type.getText();

        if (type.isString()) {
            return { name, type: "string", isOptional: false, originalType };
        }

        if (type.isNumber()) {
            return { name, type: "number", isOptional: false, originalType };
        }

        if (type.isBoolean()) {
            return { name, type: "boolean", isOptional: false, originalType };
        }

        if (type.getText() === "Date") {
            return { name, type: "date", isOptional: false, originalType };
        }

        if (type.isArray()) {
            const elementType = type.getArrayElementTypeOrThrow();
            const arrayTypeNode = this.resolveType(elementType, "element");

            if (!arrayTypeNode) {
                return undefined;
            }

            return { name, type: "array", isOptional: false, arrayType: arrayTypeNode, originalType };
        }

        if (type.isUnion()) {
            const unionTypes = type.getUnionTypes();

            const literalValues = unionTypes
                .map(t => t.getLiteralValue?.())
                .filter(v => v !== undefined);

            if (literalValues.length > 0) {
                // @ts-ignore
                return { name, type: "enum", isOptional: false, enumValues: literalValues, originalType };
            }
        }

        if (type.isEnum() || type.isEnumLiteral()) {
            const values = type.getUnionTypes()
                .map(t => t.getLiteralValue?.())
                .filter(v => v !== undefined);

            // @ts-ignore
            return { name, type: "enum", isOptional: false, enumValues: values, originalType };
        }

        if (type.isInterface() || type.isObject()) {
            const properties = type.getProperties();
            const children: DatterNode[] = [];

            properties.forEach(property => {
                const childType = property.getTypeAtLocation(property.getValueDeclarationOrThrow());
                const node = this.resolveType(childType, property.getName());

                if (node) {
                    children.push(node);
                }
            });

            return { name, type: "object", isOptional: false, children, originalType };
        }

        return undefined;
    }

}