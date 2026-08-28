#!/usr/bin/env node
/**
 * Require Node 22.x for build. @swc/core native binding fails on Node 24 and can
 * be unreliable on other versions. See STRAPI_CLOUD_NODE.md
 */
const v = process.versions.node;
const major = parseInt(v.split('.')[0], 10);

// Log so Strapi Cloud build output shows which Node is used
console.log('Node version:', v, '| platform:', process.platform, process.arch);

if (major !== 22) {
  console.error(`
\u001b[31mBuild requires Node 22.x. Current: Node ${v}.
- Strapi Cloud: set Node to 22 in environment Configuration → Basic information → Node version.
- See STRAPI_CLOUD_NODE.md\u001b[0m
`);
  process.exit(1);
}
