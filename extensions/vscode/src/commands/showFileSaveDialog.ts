// showFileSaveDialog.ts
// Logic to show the save dialog when creating a new file.

import * as vscode from 'vscode';

export async function showFileSaveDialog(defaultUri: vscode.Uri, defaultFileName: string): Promise<vscode.Uri | undefined> {
    try {
        const options: vscode.SaveDialogOptions = {
            defaultUri: vscode.Uri.joinPath(defaultUri, defaultFileName),
            saveLabel: 'Save',
            filters: {
                'All Files': ['*']
            }
        };
        const uri = await vscode.window.showSaveDialog(options);
        return uri;
    } catch (error) {
        console.error('Error showing save dialog:', error);
        return undefined;
    }
}
