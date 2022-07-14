<h1 align="center" style="border-bottom: none;"> serverless-stage-destroyer</h1>
<h3 align="center">Utility to help destroy AWS resources deployed by Serverless Framework.</h3>
<p align="center">
  <a href="https://github.com/stratiformdigital/serverless-stage-destroyer/releases/latest">
    <img alt="latest release" src="https://img.shields.io/github/release/stratiformdigital/serverless-stage-destroyer.svg">
  </a>
  <a href="https://www.npmjs.com/package/@stratiformdigital/serverless-stage-destroyer">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/@stratiformdigital/serverless-stage-destroyer/latest.svg">
  </a>
  <a href="https://codeclimate.com/github/stratiformdigital/serverless-stage-destroyer/maintainability">
    <img alt="Maintainability" src="https://api.codeclimate.com/v1/badges/20f59ef91bd30565c424/maintainability">
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img alt="semantic-release: angular" src="https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release">
  </a>
  <a href="https://dependabot.com/">
    <img alt="Dependabot" src="https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot">
  </a>
  <a href="https://github.com/prettier/prettier">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
  </a>
</p>

## Usage

Install to your project with your packager manager of choice, likely as a dev dependency:
```
npm install serverless-stage-destroyer --save-dev
```
or
```
yarn add serverless-stage-destroyer --dev
```

Using the package to destroy resources associated with the "foo" stage in Amazon's us-east-1 region:
```
import { ServerlessStageDestroyer } from "serverless-stage-destroyer"

...

let destroyer = new ServerlessStageDestroyer;
destroyer.destroy("us-east-1", "foo");
```

## Background

## Assorted Notes/Considerations

This package is designed to prompt the user to confirm they want to proceed with destroying a given stage, by way of asking for re-input of the stage name.  If the environment variable CI is present and set to true, as is the case for most CI systems, this confirmation is bypassed.

This package is designed to refuse to destroy stages named master, main, staging, or production.  There may be use cases where destroying stages with those names is desired, but this package doesn't want to help with that for now.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

See [LICENSE](LICENSE) for full details.
