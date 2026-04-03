import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import fs from 'node:fs/promises';
import { getFolderSize, openProjectInIde } from './utils.ts';

test('getFolderSize returns sum of file sizes', async () => {
  const readdirMock = mock.method(fs, 'readdir', async () => {
    return [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true },
    ];
  });

  const statMock = mock.method(fs, 'stat', async (path: string) => {
    if (path.endsWith('file1.txt')) {
      return { size: 100 };
    }
    if (path.endsWith('file2.txt')) {
      return { size: 200 };
    }
    return { size: 0 };
  });

  // We need to handle the recursive call to subdir
  readdirMock.mock.mockImplementationOnce(async () => {
    return [
      { name: 'file2.txt', isDirectory: () => false },
    ];
  }, 1);

  const size = await getFolderSize('/fake/dir');

  assert.strictEqual(size, 300);

  readdirMock.mock.restore();
  statMock.mock.restore();
});

test('openProjectInIde rejects non-whitelisted commands', async () => {
  const result = await openProjectInIde('/some/path', 'rm -rf /');
  assert.strictEqual(result.success, false);
  assert.match(result.error || '', /is not allowed/);
});


test('getFolderSize returns 0 on error (catch block test)', async () => {
  const readdirMock = mock.method(fs, 'readdir', async () => {
    throw new Error('Unreadable directory');
  });

  const size = await getFolderSize('/unreadable/dir');

  assert.strictEqual(size, 0);

  readdirMock.mock.restore();
});

test('getFolderSize ignores .git directory', async () => {
    const readdirMock = mock.method(fs, 'readdir', async () => {
      return [
        { name: '.git', isDirectory: () => true },
        { name: 'file1.txt', isDirectory: () => false },
      ];
    });

    const statMock = mock.method(fs, 'stat', async () => {
      return { size: 100 };
    });

    const size = await getFolderSize('/fake/repo');

    assert.strictEqual(size, 100);

    readdirMock.mock.restore();
    statMock.mock.restore();
});

test('getFolderSize ignores node_modules directory', async () => {
  const readdirMock = mock.method(fs, 'readdir', async () => {
    return [
      { name: 'node_modules', isDirectory: () => true },
      { name: 'file1.txt', isDirectory: () => false },
    ];
  });

  const statMock = mock.method(fs, 'stat', async () => {
    return { size: 100 };
  });

  const size = await getFolderSize('/fake/repo');

  assert.strictEqual(size, 100);

  readdirMock.mock.restore();
  statMock.mock.restore();
});
