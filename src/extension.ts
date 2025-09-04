import * as vscode from 'vscode';
import { LanguageExtractorFactory } from './core';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('datter-vscode.generateFromFile', async () => {
		const editor = vscode.window.activeTextEditor;

		if(!editor) {
			vscode.window.showInformationMessage('No active editor found.');
			return;
		}

		try {
			const extractor = LanguageExtractorFactory.createExtractorFor(editor.document.languageId);
			const nodes = await extractor.parseFile(); 

			if(nodes.length === 0) {
				vscode.window.showInformationMessage('Could not extract any valid type definitions.');
				return;
			}

			const intermediateRepresentation = JSON.stringify(nodes, null, 2);
			vscode.workspace.openTextDocument({ content: intermediateRepresentation, language: 'json' })
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

export function deactivate() {}
