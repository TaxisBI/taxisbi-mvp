import express, { Request, Response } from "express";
import { getAgingChart } from "./routes/agingChart";

type BucketOperator = '=' | '<>' | '>=' | '<=' | '>' | '<';

type AgingBucketConditionInput = {
	operator: BucketOperator;
	value: number;
};

type AgingBucketInput = {
	name: string;
	conditions: AgingBucketConditionInput[];
};

function isBucketOperator(value: unknown): value is BucketOperator {
	return value === '=' || value === '<>' || value === '>=' || value === '<=' || value === '>' || value === '<';
}

function parseAgingBuckets(input: unknown): AgingBucketInput[] | undefined {
	if (typeof input !== "string" || !input.trim()) {
		return undefined;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(input);
	} catch {
		throw new Error("Invalid buckets payload. Expected JSON array.");
	}

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error("Buckets must be a non-empty array.");
	}

	if (parsed.length > 30) {
		throw new Error("Too many buckets. Maximum is 30.");
	}

	const buckets: AgingBucketInput[] = parsed.map((raw, index) => {
		if (!raw || typeof raw !== "object") {
			throw new Error(`Bucket ${index + 1} is invalid.`);
		}

		const candidate = raw as Record<string, unknown>;
		const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
		const rawConditions = candidate.conditions;

		if (!name) {
			throw new Error(`Bucket ${index + 1} name is required.`);
		}

		if (name.length > 64) {
			throw new Error(`Bucket ${index + 1} name is too long (max 64).`);
		}

		if (!Array.isArray(rawConditions) || rawConditions.length === 0) {
			throw new Error(`Bucket ${index + 1} must include at least one condition.`);
		}

		if (rawConditions.length > 2) {
			throw new Error(`Bucket ${index + 1} supports up to two conditions.`);
		}

		const conditions = rawConditions.map((rawCondition, conditionIndex) => {
			if (!rawCondition || typeof rawCondition !== "object") {
				throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} is invalid.`);
			}

			const condition = rawCondition as Record<string, unknown>;
			if (!isBucketOperator(condition.operator)) {
				throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} has invalid operator.`);
			}

			const value = Number(condition.value);
			if (!Number.isInteger(value)) {
				throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} value must be an integer.`);
			}

			return {
				operator: condition.operator,
				value,
			};
		});

		return {
			name,
			conditions,
		};
	});

	return buckets;
}

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
		const bucketDefs = parseAgingBuckets(req.query.buckets);
		const chart = await getAgingChart(reportDate, bucketDefs);
		res.status(200).json(chart);
	} catch (error) {
		if (error instanceof Error && /Bucket|buckets/i.test(error.message)) {
			res.status(400).json({ error: error.message });
			return;
		}

		console.error("Failed to load aging chart", error);
		res.status(500).json({ error: "Failed to load aging chart" });
	}
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
