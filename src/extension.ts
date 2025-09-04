import * as vscode from 'vscode';
import { DataGenerator, LanguageExtractorFactory } from './core';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('datter-vscode.generateFromFile', async () => {
		const editor = vscode.window.activeTextEditor;

		if(!editor) {
			vscode.window.showInformationMessage('No active editor found.');
			return;
		}

		const collectionCount = await inputCollectionCount();

		try {
			const extractor = LanguageExtractorFactory.createExtractorFor(editor.document.languageId);
			const nodes = await extractor.parseFile(); 

			if(nodes.length === 0) {
				vscode.window.showInformationMessage('Could not extract any valid type definitions.');
				return;
			}

			const generator = new DataGenerator(nodes);
			const mockData = await generator.generate(collectionCount);

			const results = JSON.stringify(mockData, null, 2);

			vscode.workspace.openTextDocument({ content: results, language: 'json' })
				.then(doc => {
					vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
				});
		} catch (error: any) {
			console.error('Failed to parse types:', error);
			vscode.window.showErrorMessage(`An error occurred during parsing: ${error.message}`);
		}

	});

	context.subscriptions.push(disposable);
}

async function inputCollectionCount() {
	const userInput = await vscode.window.showInputBox({
		placeHolder: '10',
		prompt: 'Please enter the number of outputs',
		value: '10',
		validateInput: text => {
			if (!/^\d+$/.test(text)) {
				return 'Please enter a valid number.';
			}

			return null;
		}
	});

	const parsed = parseInt(userInput || "10", 10);

	if(isNaN(parsed)) {
		return 10;
	}

	return parsed;
}

export function deactivate() {}
