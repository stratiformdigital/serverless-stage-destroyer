import { ServerlessStageDestroyer } from "./../dist/index.js";
import LabeledProcessRunner from "./runner.mjs";
console.log("hello");

const runner = new LabeledProcessRunner();

async function deploy() {
    console.log("lets deploy")
    await runner.run_command_and_output(
        `deploy services`,
        ["sls", "deploy"],
        'tests/services'
    );
    console.log('lol');
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
        await destroyer.destroy(region, "dev", filters);
      }
}

await deploy()
await destroyAll()

