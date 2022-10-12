import { Application } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import { router } from "./routes.ts";

const app = new Application();

app.use(router.routes());

app.addEventListener("error", (evt) => {
  console.log(evt.error);
});
app.addEventListener("listen", () => {
  console.log("Listening ");
});

await app.listen({ port: parse(Deno.args).port || 8000 });
