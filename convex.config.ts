import { defineConfig } from "convex/server";

export default defineConfig({
  functions: "src/convex",
  externalPackages: ["xlsx"],
});
