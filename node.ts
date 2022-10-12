import { Router } from "https://deno.land/x/oak@v11.1.0/router.ts";

export default function startNode(
  router: Router,
  coordinator: string,
  port: number
) {
  console.log("Starting in node mode");

  router.post("/query", async (ctx) => {
    const operation = await ctx.request.body({ type: "json" }).value;

    console.log("Received operation ", operation.id);

    // send response to coordinator

    ctx.response.body = {
      valid: false,
    };
  });

  router.post("/finalize", async (ctx) => {
    const { id, commit } = await ctx.request.body({ type: "json" }).value;

    if (commit) {
      console.log("Commiting operation " + id);
    } else {
      console.log("Rolling back operation " + id);
    }
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
