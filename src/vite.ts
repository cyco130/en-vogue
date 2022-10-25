import { PluginOption, ViteDevServer } from "vite";
import { transformAsync } from "@babel/core";
import { babelTransformEnVogue } from "./babel";
import postcss from "postcss";
import { parse } from "postcss-js";
import postCssNested from "postcss-nested";

export function enVogue(): PluginOption[] {
	const cssMap = new Map<string, [string, number, (() => void)?]>();
	let server: ViteDevServer | undefined;

	return [
		{
			name: "en-vogue:css",
			enforce: "pre",
			resolveId(id) {
				if (cssMap.has(id)) {
					return id;
				}
			},

			async load(id) {
				if (cssMap.has(id)) {
					const lastUpdate =
						server!.moduleGraph.getModuleById(id)!.lastInvalidationTimestamp;
					const entry = cssMap.get(id)!;
					const timeStamp = entry[1];

					// If the module has been updated since the last time we
					// have to wait for the Babel transform to complete
					if (lastUpdate > timeStamp) {
						const { promise, resolve } = deferred();
						entry[2] = resolve;
						await promise;
					}

					return cssMap.get(id)![0];
				}
			},
		},
		{
			name: "en-vogue:js",

			configureServer(devServer) {
				server = devServer;
			},

			async transform(code, id) {
				if (
					!id.match(/\.(j|t)sx?$/) ||
					!code.includes("en-vogue") ||
					!code.match(/\b(css|dynamicCss)\b/)
				) {
					return;
				}

				const options: any = { moduleId: id };
				const out = await transformAsync(code, {
					filename: "test.ts",
					plugins: [babelTransformEnVogue(options)],
				});

				if (!out || !out.code) return;

				const cssOut = await postcss([postCssNested]).process(options.output, {
					parser: parse,
					from: "x.js",
				});

				const resolve = cssMap.get(id + "?en-vogue.css")?.[2];
				cssMap.set(id + "?en-vogue.css", [cssOut.css, Date.now()]);
				resolve?.();

				return {
					code: out.code,
				};
			},
		},
	];
}

interface DeferredPromise<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (error: unknown) => void;
}

function deferred<T = void>(): DeferredPromise<T> {
	let resolve: (value: T) => void;
	let reject: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve: resolve!, reject: reject! };
}
