/**
 * Build Script for ScriptlyX
 *
 * Uses esbuild to bundle TypeScript files for Chrome Extension.
 */

import * as esbuild from "esbuild";
import { existsSync, mkdirSync } from "fs";

const isWatch = process.argv.includes("--watch");

// Ensure build directory exists
if (!existsSync("build")) {
  mkdirSync("build", { recursive: true });
}

// Common build options
const commonOptions = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? "inline" : false,
  target: ["chrome100"],
  logLevel: "info",
};

// Build configurations for each entry point
const buildConfigs = [
  {
    entryPoints: ["src/background/service-worker.ts"],
    outfile: "build/background/service-worker.js",
    format: "esm",
  },
  {
    entryPoints: ["src/content/content-script.ts"],
    outfile: "build/content/content-script.js",
    format: "iife", // Content scripts need IIFE format
  },
  {
    entryPoints: ["src/popup/popup.ts"],
    outfile: "build/popup/popup.js",
    format: "esm",
  },
];

async function build() {
  try {
    if (isWatch) {
      console.log("Starting watch mode...\n");

      // Create contexts for watch mode
      const contexts = await Promise.all(
        buildConfigs.map((config) =>
          esbuild.context({
            ...commonOptions,
            ...config,
          })
        )
      );

      // Start watching
      await Promise.all(contexts.map((ctx) => ctx.watch()));

      console.log("Watching for changes...");
    } else {
      console.log("Building ScriptlyX...\n");

      // Build all entry points
      await Promise.all(
        buildConfigs.map((config) =>
          esbuild.build({
            ...commonOptions,
            ...config,
          })
        )
      );

      console.log("\nBuild complete!");
      console.log("Load the extension in Chrome:");
      console.log("1. Open chrome://extensions");
      console.log('2. Enable "Developer mode"');
      console.log('3. Click "Load unpacked"');
      console.log("4. Select the project folder");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
