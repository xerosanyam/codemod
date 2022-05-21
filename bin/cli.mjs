import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { globby } from "globby";
import inquirer from "inquirer";
import meow from "meow";
import { execaSync } from "execa";
import isGitClean from "is-git-clean";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const jscodeshift = require.resolve("jscodeshift/bin/jscodeshift");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transformerDirectory = join(__dirname, "../", "transformer");

function checkGitStatus(force) {
  let clean = false;
  let errorMessage = "Unable to determine if git directory is clean";
  try {
    clean = isGitClean.sync(process.cwd());
    errorMessage = "Git directory is not clean";
  } catch (err) {
    if (err && err.stderr && err.stderr.indexOf("Not a git repository") >= 0) {
      clean = true;
    }
  }

  if (!clean) {
    if (force) {
      console.log(`WARNING: ${errorMessage}. Forcibly continuing.`);
    } else {
      console.log(
        "before we continue, please stash or commit your git changes."
      );
      console.log(
        "\nYou may use the --force flag to override this safety check."
      );
      process.exit(1);
    }
  }
}

function runTransform({ files, flags, parser, transformer, answers }) {
  const transformerPath = join(transformerDirectory, `${transformer}.js`);

  let args = [];

  const { dry, print, explicitRequire } = flags;

  if (dry) {
    args.push("--dry");
  }
  if (print) {
    args.push("--print");
  }

  if (explicitRequire === "false") {
    args.push("--explicit-require=false");
  }

  args.push("--verbose=2");

  // args.push("--ignore-pattern=**/node_modules/**");

  // args.push("--parser", parser);

  args.push("--extensions=tsx,ts,jsx,js");

  args = args.concat(["--transform", transformerPath]);

  if (flags.jscodeshift) {
    args = args.concat(flags.jscodeshift);
  }

  args = args.concat(files);

  console.log(`Executing command: jscodeshift ${args.join(" ")}`);

  const result = execaSync(jscodeshift, args, {
    stdio: "inherit",
    stripEof: false,
  });

  if (result.error) {
    throw result.error;
  }
}

const TRANSFORMER_INQUIRER_CHOICES = [
  {
    name: "extract-strings: Extracts all strings from components for proper translation",
    value: "extract-strings",
  },
];

function expandFilePathsIfNeeded(filesBeforeExpansion) {
  const shouldExpandFiles = filesBeforeExpansion.some((file) =>
    file.includes("*")
  );
  return shouldExpandFiles
    ? globby(filesBeforeExpansion)
    : filesBeforeExpansion;
}

export function run() {
  const cli = meow(
    {
      importMeta: import.meta,
      description: "Codemods for updating React APIs.",
      help: `
    Usage
      $ npx react-codemod <transform> <path> <...options>

        transform    One of the choices from https://github.com/reactjs/react-codemod
        path         Files or directory to transform. Can be a glob like src/**.test.js

    Options
      --force            Bypass Git safety checks and forcibly run codemods
      --dry              Dry run (no changes are made to files)
      --print            Print transformed files to your terminal
      --explicit-require Transform only if React is imported in the file (default: true)

      --jscodeshift  (Advanced) Pass options directly to jscodeshift
    `,
    },
    {
      boolean: ["force", "dry", "print", "explicit-require", "help"],
      string: ["_"],
      alias: {
        h: "help",
      },
    }
  );

  if (!cli.flags.dry) {
    checkGitStatus(cli.flags.force);
  }

  if (
    cli.input[0] &&
    !TRANSFORMER_INQUIRER_CHOICES.find((x) => x.value === cli.input[0])
  ) {
    console.error("Invalid transform choice, pick one of:");
    console.error(
      TRANSFORMER_INQUIRER_CHOICES.map((x) => "- " + x.value).join("\n")
    );
    process.exit(1);
  }

  inquirer
    .prompt([
      {
        type: "input",
        name: "files",
        message: "On which files or directory should the codemod be applied?",
        when: !cli.input[1],
        default: ".",
        filter: (files) => files.trim(),
      },
      {
        type: "list",
        name: "transformer",
        message: "Which transform would you like to apply?",
        when: !cli.input[0],
        pageSize: TRANSFORMER_INQUIRER_CHOICES.length,
        choices: TRANSFORMER_INQUIRER_CHOICES,
      },
    ])
    .then((answers) => {
      const { files, transformer, parser } = answers;

      const filesBeforeExpansion = cli.input[1] || files;
      const filesExpanded = expandFilePathsIfNeeded([filesBeforeExpansion]);

      const selectedTransformer = cli.input[0] || transformer;
      const selectedParser = cli.flags.parser || parser;

      if (!filesExpanded.length) {
        console.log(
          `No files found matching ${filesBeforeExpansion.join(" ")}`
        );
        return null;
      }

      return runTransform({
        files: filesExpanded,
        flags: cli.flags,
        parser: selectedParser,
        transformer: selectedTransformer,
        answers: answers,
      });
    });
}
