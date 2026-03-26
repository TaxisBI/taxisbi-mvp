import fs from 'node:fs/promises';
import { RulebookArtifactNotFoundError } from './resolveRulebookPaths';

export async function loadChartSpec(specPath: string): Promise<Record<string, unknown>> {
  try {
    const specText = await fs.readFile(specPath, 'utf8');
    return JSON.parse(specText) as Record<string, unknown>;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new RulebookArtifactNotFoundError(`Chart spec not found: ${specPath}`);
    }
    throw error;
  }
}

