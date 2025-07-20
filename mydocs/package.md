# Understanding package.json

## What is package.json?

This file is the ID card of our library. It tells npm (Node Package Manager) everything about our project:
- What it is
- What it needs to run
- How to run it
- Where to find its files

## Key Parts of Our package.json

### Basic Information
```json
{
  "name": "react-draggable-frame",
  "version": "1.0.8",
  "type": "module",
  "description": "A draggable, responsive React frame component with touch support and smart anchoring"
}
```
This is our library's identity - its name, current version, and what it does.

### Entry Points
```json
{
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts"
}
```
Tells other projects where to find our code:
- `main`: For older systems (CommonJS)
- `module`: For modern systems (ES Modules)
- `types`: For TypeScript users

### What Files to Publish
```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```
Only these files will be included when publishing to npm.

### Scripts
```json
{
  "scripts": {
    "build": "rollup -c",
    "prepublishOnly": "npm run build",
    "dev": "vite",
    "dev-host": "vite --host",
    "preview": "vite preview"
  }
}
```
Commands we can run:
- `npm run build`: Creates the distribution files
- `npm run dev`: Starts development server
- `npm publish`: Will automatically build before publishing

### Dependencies
```json
{
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.8",
    "@rollup/plugin-node-resolve": "^15.3.1",
    "@rollup/plugin-typescript": "^11.1.6",
    // ... other dev dependencies
  }
}
```
- `peerDependencies`: What users need to have in their project
- `devDependencies`: What we need to develop and build the library

## In Simple Terms

Our package.json:
1. Names and describes our library
2. Points to the right files for different users (CommonJS, ES Modules, TypeScript)
3. Lists only necessary files for publishing
4. Provides commands for development and building
5. Specifies what dependencies users need (React) and what we need for development

## What Does "Rollup" Mean?

When we see `"build": "rollup -c"` in our scripts, "rollup" refers to bundling our files together. Think of it like this:

1. We have multiple separate files:
   - src/index.ts
   - src/DraggableFrame.tsx
   - src/Draggable.tsx
   - and other files...

2. Rollup "rolls" all these files up into:
   - One neat package (like rolling up a snowball)
   - Two formats (dist/index.js and dist/index.esm.js)
   - Without including React (because that comes from the user)

The name "Rollup" comes from this concept - it rolls up multiple JavaScript/TypeScript files into a single, organized bundle that others can easily use. It's like taking a bunch of loose papers (our source files) and rolling them into a tight scroll (our bundled output) - but in a way that's organized and efficient.
