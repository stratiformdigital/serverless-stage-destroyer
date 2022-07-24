import { ServerlessStageDestroyer } from "./../dist/index.js";
import LabeledProcessRunner from "./runner.mjs";

const runner = new LabeledProcessRunner();

async function deploy() {
    await runner.run_command_and_output(
        `deploy services`,
        ["sls", "deploy", "--stage", process.env.STAGE_NAME],
        'tests/services'
    );
}

async function destroyAll() {
    let destroyer = new ServerlessStageDestroyer();
      let filters = [
        {
          Key: "PROJECT",
          Value: "serverless-stage-destroyer",
        },
      ];
      const regions = [
        "us-east-1",
        "us-east-2"
      ];
      for (let region of regions) {
        await destroyer.destroy(region, process.env.STAGE_NAME, filters);
      }
}

await deploy()
await destroyAll()

