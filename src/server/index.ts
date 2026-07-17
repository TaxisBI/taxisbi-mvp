import express, { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { loadBuiltInThemes, ThemeContext } from "./routes/agingChart";
import chartsRouter from "./routes/charts";

type ThemeScope = "global" | "domain" | "rulebook" | "dashboard";

type ThemeSaveRequest = {
	key?: unknown;
	label?: unknown;
	scope?: unknown;
	extends?: unknown;
	ui?: unknown;
	spec?: unknown;
	createdBy?: unknown;
	displayOrder?: unknown;
	context?: {
		domain?: unknown;
		rulebook?: unknown;
		chart?: unknown;
		dashboard?: unknown;
	};
};

type ThemeDef = {
	key: string;
	label: string;
	createdBy?: string;
	displayOrder?: number;
	extends?: string;
	scope: ThemeScope;
	appliesTo?: {
		domain?: string[];
		rulebook?: string[];
		chart?: string[];
		dashboard?: string[];
	};
	ui: Record<string, unknown>;
	spec: Record<string, unknown>;
};


function isThemeScope(value: unknown): value is ThemeScope {
	return value === "global" || value === "domain" || value === "rulebook" || value === "dashboard";
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSafeThemeKey(input: unknown) {
	if (typeof input !== "string") {
		throw new Error("Theme key is required.");
	}

	const normalized = input.trim().toLowerCase().replace(/\s+/g, "-");
	if (!/^[a-z0-9][a-z0-9-_]{1,62}$/.test(normalized)) {
		throw new Error("Theme key must be 2-63 chars and use letters, numbers, '-' or '_'.");
	}

	return normalized;
}

function toSafeThemeSegment(input: unknown, label: string) {
	if (typeof input !== "string") {
		throw new Error(`${label} is required.`);
	}

	const normalized = input.trim().replace(/\s+/g, "-");
	if (!/^[A-Za-z0-9][A-Za-z0-9-_]{1,62}$/.test(normalized)) {
		throw new Error(`${label} must be 2-63 chars and use letters, numbers, '-' or '_'.`);
	}

	return normalized;
}

function toThemeQuerySegment(input: unknown, fallback: string, label: string) {
	if (typeof input !== "string" || !input.trim()) {
		return fallback;
	}
	return toSafeThemeSegment(input, label);
}

function buildThemeTarget(
	rootPath: string,
	scope: ThemeScope,
	themeKey: string,
	context: { domain: string; rulebook: string; chart: string; dashboard: string }
) {
	if (scope === "global") {
		return {
			filePath: path.join(rootPath, "1_global", `${themeKey}.json`),
			appliesTo: {
				chart: [context.chart],
			},
		};
	}

	if (scope === "domain") {
		return {
			filePath: path.join(rootPath, "2_domain", context.domain, `${themeKey}.json`),
			appliesTo: {
				domain: [context.domain],
				chart: [context.chart],
			},
		};
	}

	if (scope === "rulebook") {
		return {
			filePath: path.join(rootPath, "3_rulebook", context.domain, context.rulebook, `${themeKey}.json`),
			appliesTo: {
				domain: [context.domain],
				rulebook: [context.rulebook],
				chart: [context.chart],
			},
		};
	}

	return {
		filePath: path.join(rootPath, "4_dashboard", context.dashboard, `${themeKey}.json`),
		appliesTo: {
			dashboard: [context.dashboard],
			chart: [context.chart],
		},
	};
}

async function createThemeFile(payload: ThemeSaveRequest): Promise<ThemeDef> {
	const key = toSafeThemeKey(payload.key);
	if (typeof payload.label !== "string" || !payload.label.trim()) {
		throw new Error("Theme label is required.");
	}

	if (!isThemeScope(payload.scope)) {
		throw new Error("Theme scope must be one of: global, domain, rulebook, dashboard.");
	}

	if (!isObject(payload.ui)) {
		throw new Error("Theme ui payload must be an object.");
	}

	const spec = isObject(payload.spec) ? payload.spec : {};
	const createdBy = typeof payload.createdBy === "string" && payload.createdBy.trim()
		? payload.createdBy.trim()
		: "Color Studio";

	const context = {
		domain: toSafeThemeSegment(payload.context?.domain ?? "AR", "Domain"),
		rulebook: toSafeThemeSegment(payload.context?.rulebook ?? "Receivable_item", "rulebook"),
		chart: toSafeThemeSegment(payload.context?.chart ?? "aging_by_bucket", "Chart"),
		dashboard: toSafeThemeSegment(payload.context?.dashboard ?? "ar-aging-bucket", "Dashboard"),
	};

	const themeRoot = path.resolve(process.cwd(), "themes");
	const target = buildThemeTarget(themeRoot, payload.scope, key, context);

	let fileExists = false;
	try {
		await fs.access(target.filePath);
		fileExists = true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code && (error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw error;
		}
	}

	if (fileExists) {
		throw new Error("Theme key already exists at this scope. Use a different key.");
	}

	const themeDef: ThemeDef = {
		key,
		label: payload.label.trim(),
		createdBy,
		displayOrder: typeof payload.displayOrder === "number" ? payload.displayOrder : undefined,
		extends: typeof payload.extends === "string" && payload.extends.trim() ? payload.extends.trim() : undefined,
		scope: payload.scope,
		appliesTo: target.appliesTo,
		ui: payload.ui,
		spec,
	};

	await fs.mkdir(path.dirname(target.filePath), { recursive: true });
	await fs.writeFile(target.filePath, `${JSON.stringify(themeDef, null, 2)}\n`, "utf8");

	return themeDef;
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

app.use("/api/charts", chartsRouter);

app.get("/api/themes", async (req: Request, res: Response) => {
	try {
		const context: ThemeContext = {
			domain: toThemeQuerySegment(req.query.domain, "AR", "Domain"),
			rulebook: toThemeQuerySegment(req.query.rulebook, "Receivable_item", "rulebook"),
			chart: toThemeQuerySegment(req.query.chart, "aging_by_bucket", "Chart"),
			dashboard: toThemeQuerySegment(req.query.dashboard, "ar-aging-bucket", "Dashboard"),
		};

		const themeRootPath = path.resolve(process.cwd(), "themes");
		const themes = await loadBuiltInThemes(themeRootPath, context);
		const defaultTheme = themes.light ? "light" : Object.keys(themes)[0] ?? "light";

		res.status(200).json({ themes, defaultTheme, context });
	} catch (error) {
		if (error instanceof Error && /required|must be/i.test(error.message)) {
			res.status(400).json({ error: error.message });
			return;
		}

		console.error("Failed to load themes", error);
		res.status(500).json({ error: "Failed to load themes" });
	}
});

app.post("/api/themes", async (req: Request, res: Response) => {
	try {
		const created = await createThemeFile(req.body as ThemeSaveRequest);
		res.status(201).json({ theme: created });
	} catch (error) {
		if (error instanceof Error) {
			if (/required|must be|already exists/i.test(error.message)) {
				res.status(400).json({ error: error.message });
				return;
			}
		}

		console.error("Failed to save theme file", error);
		res.status(500).json({ error: "Failed to save theme file" });
	}
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

