import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/vite.ts"],
		format: ["cjs", "esm"],
		target: "node14",
		dts: true,
	},
]);
