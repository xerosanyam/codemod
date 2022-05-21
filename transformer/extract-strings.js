import fs from "fs";
import path from "path";
import os from "os";

import { transformFromAstSync } from "@babel/core";
import { parse, print } from "recast";

import lodash from "lodash";
const { camelCase } = lodash;

const removeWhiteSpace = (str) => str.replace(/\s+/gim, " ").trim();

const writeFile = async (file, strings) => {
  if (Object.keys(strings).length === 0) return;
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
          if (!key) return;
          const keyEnclosed = "{t('" + key + "')}";
          if (textWithoutWhitespace) {
            strings[key] = text.trim();
            path.replaceWith(t.jsxIdentifier(`${keyEnclosed}`));
          }
        },
      },
    };
  }

  const options = {
    cloneInputAst: false,
    code: false,
    ast: true,
    plugins: [updateContent],
  };
  const { ast: transformedAST } = transformFromAstSync(ast, code, options);
  await writeFile(filePath, strings);
  const result = print(transformedAST).code;
  return result;
}

export default function jsCodeShift(file) {
  const transformedSource = babelRecast(file.source, file.path);
  return transformedSource;
}
