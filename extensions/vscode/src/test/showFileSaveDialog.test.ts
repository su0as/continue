import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';

// Mock vscode module
vi.mock('vscode', () => {
    const Uri = {
        file: (path: string) => ({ fsPath: path }),
        joinPath: (uri: any, ...segments: string[]) => {
            const joined = path.join(uri.fsPath, ...segments);
            return { fsPath: joined };
        }
    };

    return {
        Uri,
        window: {
            showSaveDialog: vi.fn()
        }
    };
});

describe('showFileSaveDialog', () => {
    let showFileSaveDialog: any;
    let vscode: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const vscodeModule = await import('vscode');
        vscode = vscodeModule;
        const module = await import('../commands/showFileSaveDialog');
        showFileSaveDialog = module.showFileSaveDialog;
    });

    describe('Path Resolution', () => {
        it('should suggest correct filename for simple file', async () => {
            const mockUri = { fsPath: '/test/saved.js' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            const workspaceUri = vscode.Uri.file('/workspace');
            const result = await showFileSaveDialog(workspaceUri, 'test.js');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', 'test.js')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
            expect(result).toEqual(mockUri);
        });

        it('should extract filename from nested path', async () => {
            const mockUri = { fsPath: '/test/components/Button.tsx' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            const workspaceUri = vscode.Uri.file('/workspace');
            const result = await showFileSaveDialog(workspaceUri, 'Button.tsx');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', 'Button.tsx')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });

        it('should handle paths with multiple extensions', async () => {
            const mockUri = { fsPath: '/test/config.test.json' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            const workspaceUri = vscode.Uri.file('/workspace');
            const result = await showFileSaveDialog(workspaceUri, 'config.test.json');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', 'config.test.json')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });
    });

    describe('Dialog Behavior', () => {
        it('should return undefined when user cancels', async () => {
            vscode.window.showSaveDialog.mockResolvedValue(undefined);

            const workspaceUri = vscode.Uri.file('/workspace');
            const result = await showFileSaveDialog(workspaceUri, 'test.js');

            expect(result).toBeUndefined();
        });

        it('should return selected URI when user confirms', async () => {
            const selectedUri = { fsPath: '/custom/location/myfile.js' };
            vscode.window.showSaveDialog.mockResolvedValue(selectedUri);

            const workspaceUri = vscode.Uri.file('/workspace');
            const result = await showFileSaveDialog(workspaceUri, 'test.js');

            expect(result).toEqual(selectedUri);
            expect(result.fsPath).toBe('/custom/location/myfile.js');
        });
    });

    describe('Security Tests', () => {
        it('should sanitize absolute paths', async () => {
            const workspaceUri = vscode.Uri.file('/workspace');
            await showFileSaveDialog(workspaceUri, 'passwd');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', 'passwd')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });

        it('should sanitize path traversal attempts', async () => {
            const workspaceUri = vscode.Uri.file('/workspace');
            await showFileSaveDialog(workspaceUri, 'sensitive.txt');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', 'sensitive.txt')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });
    });

    describe('Platform Compatibility', () => {
        it('should handle Windows-style paths', async () => {
            const workspaceUri = { fsPath: 'C:\\workspace' };
            const mockUri = { fsPath: 'C:\\workspace\\components\\Test.tsx' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            await showFileSaveDialog(workspaceUri, 'Test.tsx');

            expect(vscode.window.showSaveDialog).toHaveBeenCalled();
            const call = vscode.window.showSaveDialog.mock.calls[0][0];
            expect(call.defaultUri.fsPath).toMatch(/Test\.tsx$/);
        });

        it('should handle Unix-style paths', async () => {
            const workspaceUri = vscode.Uri.file('/home/user/project');
            const mockUri = { fsPath: '/home/user/project/src/index.js' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            await showFileSaveDialog(workspaceUri, 'index.js');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: '/home/user/project/index.js'
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle dialog errors gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vscode.window.showSaveDialog.mockRejectedValue(new Error('Dialog failed'));

            const workspaceUri = vscode.Uri.file('/workspace');
            const result = await showFileSaveDialog(workspaceUri, 'test.js');

            expect(result).toBeUndefined();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error showing save dialog:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Special Filenames', () => {
        it('should handle files without extensions', async () => {
            const mockUri = { fsPath: '/test/Makefile' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            const workspaceUri = vscode.Uri.file('/workspace');
            await showFileSaveDialog(workspaceUri, 'Makefile');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', 'Makefile')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });

        it('should handle hidden files', async () => {
            const mockUri = { fsPath: '/test/.gitignore' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            const workspaceUri = vscode.Uri.file('/workspace');
            await showFileSaveDialog(workspaceUri, '.gitignore');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', '.gitignore')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });

        it('should handle files with spaces', async () => {
            const mockUri = { fsPath: '/test/my document.txt' };
            vscode.window.showSaveDialog.mockResolvedValue(mockUri);

            const workspaceUri = vscode.Uri.file('/workspace');
            await showFileSaveDialog(workspaceUri, 'my document.txt');

            expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
                defaultUri: expect.objectContaining({
                    fsPath: path.join('/workspace', 'my document.txt')
                }),
                saveLabel: 'Save',
                filters: { 'All Files': ['*'] }
            });
        });
    });
});
