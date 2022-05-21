import fs from "fs";
import path from "path";
import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";
import chalk from "chalk";
import lodash from "lodash";
const { camelCase } = lodash;
const traverse = _traverse.default;

export const removeWhiteSpace = (str) => str.replace(/\s+/gim, " ").trim();

const file = "abc.tsx";
// let file = path.resolve(file);
const strings = {};
try {
  const content = await fs.promises.readFile(file, "utf8");
  const ast = parser.parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
  traverse(ast, {
    JSXText(path) {
      const text = path.node.value;
      const textWithoutWhitespace = removeWhiteSpace(text);
      if (removeWhiteSpace(text) !== "") {
        strings[camelCase(textWithoutWhitespace)] = text;
      }
    },
  });
} catch (err) {
  console.log(chalk.red(`Failed to read ${file}`));
  console.log(err);
  console.log();
  process.exit(1);
}
console.log(strings);
