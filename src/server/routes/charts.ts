import { Router, Request, Response } from 'express';
import { ChartContractValidationError } from '../packs/getChartPayload';
import { getChartPayload } from '../packs/getChartPayload';
import { PackArtifactNotFoundError } from '../packs/resolvePackPaths';

const chartsRouter = Router();

function getSingleParam(value: string | string[] | undefined, label: string) {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  throw new PackArtifactNotFoundError(`Missing or invalid ${label} parameter.`);
}

// Generic metadata-driven chart route.
chartsRouter.get('/:domain/:pack/:chart', async (req: Request, res: Response) => {
  try {
    const payload = await getChartPayload({
      domain: getSingleParam(req.params.domain, 'domain'),
      pack: getSingleParam(req.params.pack, 'pack'),
      chart: getSingleParam(req.params.chart, 'chart'),
      queryParams: req.query as Record<string, unknown>,
    });

    res.status(200).json(payload);
  } catch (error) {
    if (error instanceof PackArtifactNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }

    if (error instanceof ChartContractValidationError) {
      res.status(422).json({
        error: error.message,
        contractErrors: error.contractErrors,
      });
      return;
    }

    console.error('Failed to load chart payload', error);
    res.status(500).json({ error: 'Failed to execute chart query' });
  }
});

export default chartsRouter;
