import fs from 'node:fs/promises';
import { RulebookArtifactNotFoundError } from './resolveRulebookPaths';

export async function loadQuerySql(queryPath: string): Promise<string> {
  try {
    return await fs.readFile(queryPath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new RulebookArtifactNotFoundError(`Chart query not found: ${queryPath}`);
    }
    throw error;
  }
}

