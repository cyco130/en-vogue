import { test, expect } from "vitest";
import { transformAsync } from "@babel/core";
import { babelTransformEnVogue, EnVogueTransformOptions } from "./babel";
import postcss from "postcss";
import { parse } from "postcss-js";

test("transforms as expected", async () => {
	const options: EnVogueTransformOptions = { moduleId: "input.jsx" };
	const { code: jsCode } = (await transformAsync(INPUT, {
		filename: "input.jsx",
		plugins: [babelTransformEnVogue(options)],
	}))!;

	const cssCode = (
		await postcss().process(options.output, { parser: parse, from: "x.js" })
	).css;

	expect(jsCode).toEqual(JS_OUTPUT);
	expect(cssCode).toEqual(CSS_OUTPUT);
});

const INPUT = `
  import { css, dynamicCss } from "en-vogue";

  const hoverColor = "blue";

  const dynamicOutput = dynamicCss({
    color: "red",
    "&:hover": {
      color: hoverColor,
    },
  });

  const staticOutput = css({
    color: "red",
    "&:hover": {
      color: "green",
    },
  })
`;

const JS_OUTPUT = `import "input.jsx?en-vogue.css";
import { css, dynamicCss } from "en-vogue";
const hoverColor = "blue";
const dynamicOutput = {
  className: "ev-1aa1wymfr5v",
  style: {
    "--ev-11dyvfpidh0": hoverColor
  }
};
const staticOutput = "ev-q8tsluhb4b";`;

const CSS_OUTPUT = `.ev-1aa1wymfr5v {
    color: red;
    &:hover {
        color: var(--ev-11dyvfpidh0)
    }
}
.ev-q8tsluhb4b {
    color: red;
    &:hover {
        color: green
    }
}`;
