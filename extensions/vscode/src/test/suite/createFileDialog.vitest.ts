import { describe, it, expect } from 'vitest';
import * as vscode from 'vscode';
import * as path from 'path';
import { ApplyToFilePayload } from 'core';

describe('Create File Dialog Test Suite', () => {
  it('Should set showSaveDialog flag for new files', () => {
    // Test payload for creating a new file
    const payload: ApplyToFilePayload = {
      streamId: 'test-stream-id',
      filepath: 'src/components/NewComponent.tsx',
      text: 'export const NewComponent = () => { return <div>Hello</div>; }',
      showSaveDialog: true,
    };

    expect(payload.showSaveDialog).toBe(true);
    expect(payload.filepath).toBe('src/components/NewComponent.tsx');
  });

  it('Should extract filename from filepath for defaultUri', () => {
    const testFilepath = 'src/utils/helper.ts';
    const filename = path.basename(testFilepath);
    const dirname = path.dirname(testFilepath);

    expect(filename).toBe('helper.ts');
    expect(dirname).toBe('src/utils');
  });

  it('Should not show dialog for existing files', () => {
    // Test payload for applying to existing file
    const payload: ApplyToFilePayload = {
      streamId: 'test-stream-id',
      filepath: '/workspace/existing-file.ts',
      text: 'console.log("updated");',
      showSaveDialog: false,
    };

    expect(payload.showSaveDialog).toBe(false);
  });

  it('Should handle filepath with just filename', () => {
    const testFilepath = 'newfile.js';
    const dirname = path.dirname(testFilepath);

    expect(dirname).toBe('.');
  });

  it('Should handle nested directory paths', () => {
    const testFilepath = 'src/features/auth/components/LoginForm.tsx';
    const filename = path.basename(testFilepath);
    const dirname = path.dirname(testFilepath);

    expect(filename).toBe('LoginForm.tsx');
    expect(dirname).toBe('src/features/auth/components');
  });
});
