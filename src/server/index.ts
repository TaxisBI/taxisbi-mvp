import express, { Request, Response } from "express";
import { getAgingChart } from "./routes/agingChart";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});

app.get("/", (_req: Request, res: Response) => {
	res.send("Express + TypeScript API is running.");
});

app.get("/api/charts/aging-by-bucket", async (req: Request, res: Response) => {
	try {
		const reportDate = typeof req.query.report_date === 'string' ? req.query.report_date : undefined;
		const chart = await getAgingChart(reportDate);
		res.status(200).json(chart);
	} catch (error) {
		console.error("Failed to load aging chart", error);
		res.status(500).json({ error: "Failed to load aging chart" });
	}
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
