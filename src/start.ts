import { v4 as uuid } from "uuid";
import { ZBClient } from "zeebe-node-next";

const timeToLive = 0;
const longerThanTTL = timeToLive + 1000;

async function main() {
  const zbc = new ZBClient("localhost");

  console.log("Deploying workflow");
  console.log(await zbc.deployWorkflow("./test.bpmn"));

  // Start inspection worker.
  zbc.createWorker(uuid(), "console-log", (job, complete, worker) => {
    worker.log(job.customHeaders.message);
    complete.success();
  });

  console.log(`Publish message with ttl: ${timeToLive}`);
  zbc.publishMessage({
    name: "interrupt",
    correlationKey: "42",
    timeToLive,
    variables: {}
  });

  // Wait longer than message TTL, so the interrupt message should be expired when this starts
  console.log(`Waiting ${longerThanTTL / 1000}s...`);
  setTimeout(async () => {
    console.log("Starting new workflow - should not be interrupted");
    console.log(
      await zbc.createWorkflowInstance("ttl-test", { processId: "42" })
    );
  }, longerThanTTL);
}

main();
