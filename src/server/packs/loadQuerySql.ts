import fs from 'node:fs/promises';
import { PackArtifactNotFoundError } from './resolvePackPaths';

export async function loadQuerySql(queryPath: string): Promise<string> {
  try {
    return await fs.readFile(queryPath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new PackArtifactNotFoundError(`Chart query not found: ${queryPath}`);
    }
    throw error;
  }
}
