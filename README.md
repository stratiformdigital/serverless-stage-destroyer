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
    <img alt="Maintainability" src="https://api.codeclimate.com/v1/badges/a54385e81ba0c9fe7c40/maintainability">
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
npm install @stratiformdigital/serverless-stage-destroyer --save-dev
```

Import the package:

```
import { ServerlessStageDestroyer } from "@stratiformdigital/serverless-stage-destroyer";
let destroyer = new ServerlessStageDestroyer();
```

Destroy resources associated with the "foo" stage in Amazon's us-east-1 region:

```
destroyer.destroy("us-east-1", "foo", {});
```

## Assorted Notes/Considerations

This package is meant to make it easy to clean up cloudformation stacks deployed by the Serverless Framework.

Keep in mind:

- Any stage that contains the substring 'prod' cannot be removed with this package. There's no override provided; if you need to destroy a stage containing 'prod', you're on your own.
- By default, the destroy function will wait for all cloudformation stacks to be destroyed. If you'd like to trigger destroys and then exit immediately without waiting, you may pass 'wait: false' in the destroy() options.

```
destroyer.destroy("us-east-1", "foo", {
  wait: false
});
```

- By default, the destroy function will prompt the user to confirm destruction by way of asking the user to re-enter the stage name. If you'd like to skip the prompt (like for CI systems), you may pass 'verify: false' in the destroy() options.

```
destroyer.destroy("us-east-1", "foo", {
  verify: false
});
```

- Any number of cloudformation tag filters may be passed in the destroy options. This can be useful if you want to destroy just a particular service. If your project adds default tags to each stage, such as to identify the parent project in a shared AWS account, you can filter on that, too. The filters can contain any number of Key/Value pairs:

```
destroyer.destroy("us-east-1", "foo", {
  filters: [
    {
      Key: "PROJECT",
      Value: "serverless-stage-destroyer",
    },
    {
      Key: "SERVICE",
      Value: "alpha",
    },
  ]
});
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

See [LICENSE](LICENSE) for full details.
