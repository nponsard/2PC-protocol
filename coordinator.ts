import { Router } from "https://deno.land/x/oak@v11.1.0/router.ts";

enum Status {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

interface Oeration {
  id: string;
  name: string;
  query: string;
}

type CoordinatorOperation = Oeration & {
  status: Status;
  nodesSuccess: string[];
  nodesFailed: string[];
};

const coordinatorOperations: Record<string, CoordinatorOperation | null> = {};

const nodes: Set<string> = new Set();

function rollbackNode(node: string, id: string) {
  console.log("Sending rollback to node", node, id);
  return fetch(`http://${node}/finalize`, {
    method: "POST",
    body: JSON.stringify({
      commit: false,
      id,
    }),
  });
}
function commitNode(node: string, id: string) {
  console.log("Sending commit to node", node, id);

  return fetch(`http://${node}/finalize`, {
    method: "POST",
    body: JSON.stringify({
      id,
      commit: true,
    }),
  });
}

function failOperation(id: string) {
  // send rollback to all nodes

  nodes.forEach((node) => {
    rollbackNode(node, id);
  });

  // remove operation from coordinatorOperations
}

function successOperation(id: string) {
  // check if all nodes have reported success

  const operation = coordinatorOperations[id];

  if (operation && operation.nodesSuccess.length === nodes.size) {
    // send commit to all nodes

    nodes.forEach((node) => {
      commitNode(node, id);
    });
    // remove operation from coordinatorOperations

    coordinatorOperations[id] = null;
  }
}

export default function startCoordinator(router: Router) {
  console.log("Starting in coordinator mode");

  router.post("/query", async (ctx) => {
    const { name, query } = await ctx.request.body({ type: "json" }).value;

    const operation: CoordinatorOperation = {
      id: crypto.randomUUID(),
      name,
      query,
      nodesFailed: [],
      nodesSuccess: [],
      status: Status.PENDING,
    } as CoordinatorOperation;

    console.log("Received query", name, query, "with id", operation.id);

    coordinatorOperations[operation.id] = operation;

    nodes.forEach((node) => {
      console.log(`Sending to ${node}`);

      fetch(`http://${node}/query`, {
        method: "POST",
        body: JSON.stringify(operation),
      })
        .then(async (res) => {
          const body = await res.json();
          const operationStatus = coordinatorOperations[operation.id];

          // operation does not exist anymore (may have failed)
          // cancel operation
          if (!operationStatus) {
            rollbackNode(node, operation.id);
            return;
          }

          if (!body.valid) throw new Error("Operation failed on node ");
          operationStatus.nodesSuccess.push(node);
          coordinatorOperations[operation.id] = operationStatus;
          successOperation(operation.id);
        })
        .catch((e) => {
          console.log("Error on node " + node + " " + e);
          const operationStatus = coordinatorOperations[operation.id];
          if (!operationStatus) {
            rollbackNode(node, operation.id);
            return;
          }

          operationStatus.nodesFailed.push(node);
          coordinatorOperations[operation.id] = operationStatus;
          failOperation(operation.id);
        });
    });
  });

  router.post("/register", async (ctx) => {
    const body = await ctx.request.body({ type: "json" }).value;

    nodes.add(body.ip);

    console.log("Registered node ", body.ip);
  });
}