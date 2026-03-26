import fs from 'node:fs/promises';
import path from 'node:path';

export class RulebookArtifactNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RulebookArtifactNotFoundError';
  }
}

export type ChartArtifactPaths = {
  domainName: string;
  packName: string;
  chartName: string;
  packRootPath: string;
  packManifestPath: string;
  chartSpecPath: string;
  querySqlPath: string;
};

function assertSafeSegment(value: string, label: string) {
  if (!/^[a-z0-9_-]+$/i.test(value)) {
    throw new RulebookArtifactNotFoundError(`Invalid ${label} segment.`);
  }
}

async function resolveExistingSegment(parentPath: string, requested: string, label: string) {
  let entries: Array<{ isDirectory: () => boolean; name: string }> = [];
  try {
    entries = await fs.readdir(parentPath, { withFileTypes: true, encoding: 'utf8' });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new RulebookArtifactNotFoundError(`${label} not found: ${requested}`);
    }
    throw error;
  }
  const match = entries.find(
    (entry) => entry.isDirectory() && entry.name.toLowerCase() === requested.toLowerCase()
  );

  if (!match) {
    throw new RulebookArtifactNotFoundError(`${label} not found: ${requested}`);
  }

  return match.name;
}

export async function resolveRulebookPaths(
  domain: string,
  rulebook: string,
  chart: string,
  workspaceRoot = process.cwd()
): Promise<ChartArtifactPaths> {
  assertSafeSegment(domain, 'domain');
  assertSafeSegment(rulebook, 'rulebook');
  assertSafeSegment(chart, 'chart');

  const domainsRoot = path.resolve(workspaceRoot, 'domains');
  const domainName = await resolveExistingSegment(domainsRoot, domain, 'Domain');
  const packsRoot = path.join(domainsRoot, domainName, 'rulebooks');
  const packName = await resolveExistingSegment(packsRoot, rulebook, 'Rulebook');

  const packRootPath = path.join(packsRoot, packName);
  const chartName = chart;

  return {
    domainName,
    packName,
    chartName,
    packRootPath,
    packManifestPath: path.join(packRootPath, 'rulebook.yaml'),
    chartSpecPath: path.join(packRootPath, 'charts', `${chartName}.vl.json`),
    querySqlPath: path.join(packRootPath, 'queries', `${chartName}.sql`),
  };
}

