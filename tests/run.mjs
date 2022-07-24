import { ServerlessStageDestroyer } from "./../dist/index.js";
import LabeledProcessRunner from "./runner.mjs";
import {
  CloudFormationClient,
  paginateDescribeStacks,
} from "@aws-sdk/client-cloudformation";
import _ from "lodash";
const runner = new LabeledProcessRunner();
const destroyer = new ServerlessStageDestroyer();
const region = "us-east-1";

Array.prototype.diff = function (arr2) {
  return this.filter((x) => !arr2.includes(x));
};

async function getAllStacksForRegion(region) {
  const client = new CloudFormationClient({ region: region });
  const stacks = [];
  for await (const page of paginateDescribeStacks({ client }, {})) {
    stacks.push(...(page.Stacks || []));
  }
  return stacks;
}

async function getAllStacksForStage(region, stage) {
  return (await getAllStacksForRegion(region))
    .filter((i) => i.Tags?.find((j) => j.Key == "STAGE" && j.Value == stage))
    .map((z) => z.StackName);
}

async function deployAll() {
  console.log("Deploying all services for testing...");
  await runner.run_command_and_output(
    `deploy services`,
    ["sls", "deploy", "--stage", process.env.STAGE_NAME],
    "tests"
  );
}
// ------------------------------------------------
await deployAll();
// ------------------------------------------------

// ------------------------------------------------
console.log("\n\nChecking prod safeguard...");
for (let stage of ["prod", "production", "fooprodbar"]) {
  try {
    await destroyer.destroy(region, stage, {});
  } catch (err) {
    if (!err.includes("You've requested a destroy for a protected stage")) {
      throw "ERROR:  Production safeguard did not work as intended.";
    }
  }
}
console.log("Check passed...");
// ------------------------------------------------

// ------------------------------------------------
console.log("\n\nChecking ability to destroy a stage.project.service...");
let before = await getAllStacksForStage(region, process.env.STAGE_NAME);
await destroyer.destroy(region, process.env.STAGE_NAME, {
  filters: [
    {
      Key: "PROJECT",
      Value: "serverless-stage-destroyer",
    },
    {
      Key: "SERVICE",
      Value: "alpha",
    },
  ],
  verify: false,
});
let after = await getAllStacksForStage(region, process.env.STAGE_NAME);
if (
  _.isEqual(
    before.diff(after).sort(),
    [`alpha-${process.env.STAGE_NAME}`].sort()
  )
) {
  console.log("Check passed...");
} else {
  throw "ERROR:  Destruction of stage.project.service check failed.";
}
// ------------------------------------------------

// ------------------------------------------------
console.log("\n\nChecking ability to destroy a stage.project...");
before = await getAllStacksForStage(region, process.env.STAGE_NAME);
await destroyer.destroy(region, process.env.STAGE_NAME, {
  filters: [
    {
      Key: "PROJECT",
      Value: "serverless-stage-destroyer",
    },
  ],
  verify: false,
});
after = await getAllStacksForStage(region, process.env.STAGE_NAME);
if (
  _.isEqual(
    before.diff(after).sort(),
    [
      `bravo-${process.env.STAGE_NAME}`,
      `charlie-${process.env.STAGE_NAME}`,
      `delta-${process.env.STAGE_NAME}`,
    ].sort()
  )
) {
  console.log("Check passed...");
} else {
  throw "ERROR:  Destruction of stage.project check failed.";
}
// ------------------------------------------------

// ------------------------------------------------
console.log("\n\nChecking ability to destroy a stage.service...");
before = await getAllStacksForStage(region, process.env.STAGE_NAME);
await destroyer.destroy(region, process.env.STAGE_NAME, {
  filters: [
    {
      Key: "SERVICE",
      Value: "echo",
    },
  ],
  verify: false,
});
after = await getAllStacksForStage(region, process.env.STAGE_NAME);
if (
  !_.isEqual(
    before.diff(after).sort(),
    [`echo-${process.env.STAGE_NAME}`].sort()
  )
) {
  throw "ERROR:  Destruction of stage.service check failed.";
}
// ------------------------------------------------

// ------------------------------------------------
console.log("\n\nChecking ability to destroy a stage...");
before = await getAllStacksForStage(region, process.env.STAGE_NAME);
await destroyer.destroy(region, process.env.STAGE_NAME, {
  verify: false,
});
after = await getAllStacksForStage(region, process.env.STAGE_NAME);
if (
  !_.isEqual(
    before.diff(after).sort(),
    [`foxtrot-${process.env.STAGE_NAME}`].sort()
  )
) {
  throw "ERROR:  Destruction of stage check failed.";
}
// ------------------------------------------------

// ------------------------------------------------
await deployAll();
// ------------------------------------------------

// ------------------------------------------------
console.log("\n\nChecking wait flag...");
before = await getAllStacksForStage(region, process.env.STAGE_NAME);
await destroyer.destroy(region, process.env.STAGE_NAME, {
  verify: false,
  wait: false,
});
after = await getAllStacksForStage(region, process.env.STAGE_NAME);
if (after.length === 0) {
  throw "ERROR:  wait flag failed to work as intended...";
}
// ------------------------------------------------

console.log("Checks passed.  Cleaning up before exiting...");
while (
  (await getAllStacksForStage(region, process.env.STAGE_NAME)).length !== 0
) {
  console.log("...");
  await new Promise((r) => setTimeout(r, 10000));
}
