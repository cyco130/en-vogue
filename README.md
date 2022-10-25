# En Vogue

Zero-runtime CSS-in-JS with static CSS extraction. Currently a proof of concept, implemented as a [Vite plugin](https://vitejs.dev).

> [Try on StackBlitz](https://stackblitz.com/edit/vitejs-vite-yvbldw?file=vite.config.ts,src%2FApp.tsx)

## Features

- Convenience of CSS-in-JS with **zero runtime overhead** (unlike [Emotion](https://emotion.sh) or [Styled Components](https://styled-components.com))
- **Colocation** of styles with components (unlike [Vanilla Extract](https://vanilla-extract.style/))
- Same performance characteristics as static CSS
- Hot reloading, code splitting, and other Vite features
- Supports all frameworks and vanilla JS

## Installation

Install the `en-vogue` package as a development dependency:

```sh
npm install -D en-vogue
```

Then import `enVogue` from `"en-vogue/vite"` and add it to your Vite config:

```js
import { defineConfig } from "vite";
import { enVogue } from "en-vogue/vite";

export default defineConfig({
	plugins: [enVogue()],
});
```

## Usage

The `css` function takes a CSS object and returns a class name. It supports nested selectors.

```js
import { css } from "en-vogue";

const className = css({
	color: "red",
	"&:hover": {
		color: "blue",
	},
});
```

The above example will generate the following CSS and return the class name `"ev-sadlkj"` (or something like that):

```css
.ev-sadlkj {
	color: red;
}

.ev-sadlkj:hover {
	color: blue;
}
```

The `css` function can't do everything a runtime CSS-in-JS solution can do. In particular, all property values have to be literal constants. You can achieve coarse-grained dynamic behavior by using class name concatenation, maybe via libraries like [`classnames`](https://github.com/JedWatson/classnames), [`clsx`](https://github.com/lukeed/clsx), or [`cva`](https://github.com/joe-bell/cva).

If you need fine-grained dynamic property values, use the `dynamicCss` function. Dynamic values will be replaced with CSS variables and returned as the `style` property, ready to be passed to a React element, for examples. The class name will be returned as the `className` property.

```js
import { dynamicCss } from "en-vogue";
import { hoverColor } from "./theme";

const { style, className } = dynamicCss({
	color: "red",
	"&:hover": {
		color: hoverColor,
	},
});
```

This will generate the following CSS:

```css
.ev-sadlkj {
	color: red;
}
.ev-sadlkj:hover {
	color: var(--ev-qwerty);
}
```

And the `className` property will contain `"ev-sadlkj"` while the `style` property will contain `{ "--ev-qwerty": hoverColor }`.

## TODO

- Missing functionality (keyframes, media queries, etc.)
- Better typings
- Automatic atomic CSS extraction

## License

[MIT](LICENSE)
