/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Properties, SimplePseudos } from "csstype";

// eslint-disable-next-line @typescript-eslint/ban-types
type CSSTypeProperties = Properties<number | (string & {})>;

export type CSSProperties = {
	[P in keyof CSSTypeProperties]: CSSTypeProperties[P];
} & {
	[P in `&${SimplePseudos}`]?: CSSProperties;
};

export function css(styles: CSSProperties): string {
	fail();
}

export function dynamicCss(styles: CSSProperties): {
	className: string;
	style: Record<`--${string}`, string>;
} {
	fail();
}

function fail(): never {
	throw new Error("en-vogue requires a Vite plugin to work");
}
