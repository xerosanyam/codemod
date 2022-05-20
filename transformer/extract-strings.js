import fs from "fs";
import path from "path";
import os from "os";

import { transformFromAstSync } from "@babel/core";
import { parse, print } from "recast";

import lodash from "lodash";
import { removeWhiteSpace } from "./utils";
const { camelCase } = lodash;

const strings = {};

// vanilla babel custom plugin
function updateContent(babel) {
  const { types: t } = babel;
  return {
    visitor: {
      JSXText(path) {
        const text = path.node.value;
        const textWithoutWhitespace = removeWhiteSpace(text);
        const key = camelCase(textWithoutWhitespace);
        const keyEnclosed = "{$t('" + key + "')}";
        if (textWithoutWhitespace) {
          strings[key] = text;
          path.replaceWith(t.jsxIdentifier(`${keyEnclosed}`));
        }
      },
    },
  };
}

const writeFile = async (file) => {
  const fileExtension = path.extname(file);

  const fileName = fileExtension
    ? path.basename(file, `${fileExtension}`)
    : file;

  try {
    await fs.promises.writeFile(
      path.join(`${process.cwd()}/${path.dirname(file)}`, `${fileName}.json`),
      JSON.stringify(strings, null, 2) + os.EOL,
      { encoding: "utf8" }
    );
  } catch (err) {
    console.log(err);
    console.log();
    process.exit(1);
  }
};
async function babelRecast(code, filePath) {
  const ast = parse(code, { parser: require("recast/parsers/babel") });

  const options = {
    cloneInputAst: false,
    code: false,
    ast: true,
    plugins: [updateContent],
  };
  const { ast: transformedAST } = transformFromAstSync(ast, code, options);
  await writeFile(filePath);
  const result = print(transformedAST).code;
  return result;
}

export default function jsCodeShift(file) {
  const transformedSource = babelRecast(file.source, file.path);
  return transformedSource;
}
