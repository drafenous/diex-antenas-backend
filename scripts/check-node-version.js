#!/usr/bin/env node
/**
 * Fail build when Node >= 24 (e.g. on Strapi Cloud).
 * @swc/core native binding does not support Node 24; use Node 22.
 * See STRAPI_CLOUD_NODE.md
 */
const v = process.versions.node;
const major = parseInt(v.split('.')[0], 10);
if (major >= 24) {
  console.error(`
\u001b[31mBuild requires Node 22. Current: Node ${v}.
Set Node version to 22 in Strapi Cloud: Settings → General → Node version.
See STRAPI_CLOUD_NODE.md\u001b[0m
`);
  process.exit(1);
}
