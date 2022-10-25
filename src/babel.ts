import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";

export interface EnVogueTransformOptions {
	moduleId: string;
	output?: any;
}

export function babelTransformEnVogue(
	options: EnVogueTransformOptions,
): PluginItem {
	options.output = Object.create(null);
	let index = 0;

	return {
		visitor: {
			Program(program) {
				let touched = false;
				program.traverse({
					CallExpression(call) {
						const callee = isCssCall(call);
						if (callee && t.isObjectExpression(call.node.arguments[0])) {
							const objectExpr = call.get("arguments")[0];
							if (!objectExpr.isObjectExpression()) {
								// TODO: Warn
								return;
							}

							touched = true;

							const styles: Array<[string, t.Expression]> = [];
							const vars: Map<string, t.Node> = new Map();
							const name = "ev-" + randomId(options.moduleId + ":" + index++);
							const styleObject: any = Object.create(null);
							options.output["." + name] = styleObject;
							let currentStyleObject = styleObject;

							// eslint-disable-next-line no-inner-declarations
							function traverseObject(obj: NodePath<t.ObjectExpression>) {
								const props = obj.get("properties");
								for (const prop of props) {
									if (
										!t.isObjectProperty(prop.node) ||
										(!t.isIdentifier(prop.node.key) &&
											!t.isStringLiteral(prop.node.key))
									) {
										// TODO: Warn
										return;
									}

									const value = prop.get("value") as NodePath;
									const key: string =
										(prop.node.key as any).name ?? (prop.node.key as any).value;
									if (value.isObjectExpression()) {
										const oldStyleObject = currentStyleObject;
										currentStyleObject = Object.create(null);
										traverseObject(value);
										oldStyleObject[key] = currentStyleObject;
										currentStyleObject = oldStyleObject;
									} else if (!value.isStringLiteral()) {
										if (callee !== "dynamicCss") {
											throw new Error("Use dynamicCss for dynamic values");
										}
										const v =
											"--ev-" + randomId(options.moduleId + ":" + index++);
										vars.set(v, value.node);
										styles.push([v, value.node as any]);
										value.replaceWith(t.stringLiteral(`var(${v})`));
										currentStyleObject[key] = `var(${v})`;
									} else {
										currentStyleObject[key] = value.node.value;
									}
								}
							}

							traverseObject(objectExpr);

							const nameNode = t.stringLiteral(name);

							const replacementNode =
								callee === "dynamicCss"
									? t.objectExpression([
											t.objectProperty(t.identifier("className"), nameNode),
											t.objectProperty(
												t.identifier("style"),
												t.objectExpression(
													styles.map(([k, v]) =>
														t.objectProperty(t.stringLiteral(k), v),
													),
												),
											),
									  ])
									: nameNode;

							call.replaceWith(replacementNode);
						}
					},
				});

				if (touched) {
					program.unshiftContainer(
						"body",
						t.importDeclaration(
							[],
							t.stringLiteral(options.moduleId + "?en-vogue.css"),
						),
					);
				}
			},
		},
	};
}

function isCssCall(expr: NodePath<t.CallExpression>) {
	const callee = expr.get("callee");
	const calleeNode = callee.node;
	if (t.isIdentifier(calleeNode)) {
		const binding = expr.parentPath.scope.getBinding(calleeNode.name);

		return (
			binding &&
			binding.path.isImportSpecifier() &&
			t.isIdentifier(binding.path.node.imported) &&
			(binding.path.node.imported.name === "css" ||
				binding.path.node.imported.name === "dynamicCss") &&
			binding.path.parentPath.isImportDeclaration() &&
			binding.path.parentPath.node.source.value === "en-vogue" &&
			binding.path.node.imported.name
		);
	}
}

/*
	cyrb53 (c) 2018 bryc (github.com/bryc)
	A fast and simple hash function with decent collision resistance.
	Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
	Public domain. Attribution appreciated.
*/
function randomId(str: string, seed = 0) {
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 =
		Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
		Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 =
		Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
		Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	const result = 4294967296 * (2097151 & h2) + (h1 >>> 0);

	return result.toString(36);
}
