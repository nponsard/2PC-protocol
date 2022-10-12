import { Router } from "https://deno.land/x/oak@v11.1.0/router.ts";
import { Operation } from "./operation.ts";

const RunningOperations: Record<string, Operation | null> = {};

export default function startNode(
  router: Router,
  coordinator: string,
  port: number
) {
  console.log("Starting in node mode");

  router.post("/query", async (ctx) => {
    const operation = await ctx.request.body({ type: "json" }).value;

    console.log("Prepare query ", operation.id);

    RunningOperations[operation.id] = operation;

    const valid = Math.random() > 0.5;

    console.log(
      `Simulating a ${valid ? "valid" : "invalid"} operation for ${
        operation.id
      }`
    );

    // send response to coordinator

    ctx.response.body = {
      valid,
    };
  });

  router.post("/finalize", async (ctx) => {
    const { id, commit } = await ctx.request.body({ type: "json" }).value;

    const operation = RunningOperations[id];

    if (!operation) return;

    if (commit) {
      console.log("Commiting operation " + id);

      await Deno.writeTextFile(
        "log-" + port,
        `${operation.id} ${operation.query}\n`,
        { append: true }
      );
    } else {
      console.log("Rolling back operation " + id);
    }

    RunningOperations[id] = null;
  });

  fetch(`http://${coordinator}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // TODO : get own ip
    body: JSON.stringify({ ip: `127.0.0.1:${port}` }),
  });
}
