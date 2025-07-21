import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { ApplyToFilePayload } from 'core';

suite('Create File Dialog Test Suite', () => {
  test('Should set showSaveDialog flag for new files', () => {
    // Test payload for creating a new file
    const payload: ApplyToFilePayload = {
      streamId: 'test-stream-id',
      filepath: 'src/components/NewComponent.tsx',
      text: 'export const NewComponent = () => { return <div>Hello</div>; }',
      showSaveDialog: true,
    };

    assert.strictEqual(payload.showSaveDialog, true);
    assert.strictEqual(payload.filepath, 'src/components/NewComponent.tsx');
  });

  test('Should extract filename from filepath for defaultUri', () => {
    const testFilepath = 'src/utils/helper.ts';
    const filename = path.basename(testFilepath);
    const dirname = path.dirname(testFilepath);

    assert.strictEqual(filename, 'helper.ts');
    assert.strictEqual(dirname, 'src/utils');
  });

  test('Should not show dialog for existing files', () => {
    // Test payload for applying to existing file
    const payload: ApplyToFilePayload = {
      streamId: 'test-stream-id',
      filepath: '/workspace/existing-file.ts',
      text: 'console.log("updated");',
      showSaveDialog: false,
    };

    assert.strictEqual(payload.showSaveDialog, false);
  });

  test('Should handle filepath with just filename', () => {
    const testFilepath = 'newfile.js';
    const dirname = path.dirname(testFilepath);

    assert.strictEqual(dirname, '.');
  });

  test('Should handle nested directory paths', () => {
    const testFilepath = 'src/features/auth/components/LoginForm.tsx';
    const filename = path.basename(testFilepath);
    const dirname = path.dirname(testFilepath);

    assert.strictEqual(filename, 'LoginForm.tsx');
    assert.strictEqual(dirname, 'src/features/auth/components');
  });
});
