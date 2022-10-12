import { parse } from "https://deno.land/std/flags/mod.ts";
import { Router } from "https://deno.land/x/oak@v11.1.0/router.ts";
import startCoordinator from "./coordinator.ts";
import startNode from "./node.ts";

export const router = new Router();

const parsed = parse(Deno.args);
const port = parsed.port || 8000;
const coordinator = parsed.coordinator;

if (!coordinator) {
  startCoordinator(router);
} else {
  startNode(router, coordinator, port);
}
