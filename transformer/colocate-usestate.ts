import fs from "fs";
import path from "path";
import os from "os";

import { transformFromAstSync } from "@babel/core";
import { parse, print } from "recast";

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

const isUseState = (path) => {
  return (
    path.get("declarations")[0].get("init").get("callee").node.name ===
    "useState"
  );
};

const getUseStateIdentifiers = (path) => {
  const elements = [];
  path
    .get("declarations")[0]
    .get("id")
    .get("elements")
    .forEach((el) => elements.push(el.node.name));
  return elements;
};

async function babelRecast(code, filePath) {
  const ast = parse(code, { parser: require("recast/parsers/babel") });

  const useStateReferences = {};
  let count = 0;

  // vanilla babel custom plugin
  function updateContent() {
    return {
      visitor: {
        VariableDeclaration(path) {
          console.log("------------------------", count);
          count += 1;
          // console.dir(path);
          console.log(Object.keys(path));
          // console.log(
          //   Object.keys(path.get("declarations")[0].get("id").get("elements"))
          // );
          // console.log(Object.keys(isUseState(path)));
          console.log(isUseState(path));
          console.log(getUseStateIdentifiers(path));
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
  // console.log(count);
  //   await writeFile(filePath, strings);
  const result = print(transformedAST).code;
  return result;
}

export default function jsCodeShift(file) {
  const transformedSource = babelRecast(file.source, file.path);
  return transformedSource;
}
