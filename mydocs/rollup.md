# Why Do We Need rollup.config.js?

When publishing a JavaScript/TypeScript library like react-draggable-frame, we need a module bundler (in our case, Rollup) because:

1. We write our code in multiple files for better organization and development
2. We use modern features (like TypeScript, ES6+ syntax)
3. We want our library to work in different environments (browsers, Node.js, different bundlers)

## What Does Rollup Do?

Rollup takes our development code and:
- Combines all our files into a distributable package
- Converts our code into formats that different systems can use (CommonJS and ES Modules)
- Handles TypeScript compilation and generates type definitions
- Creates proper package structure for npm publishing

## Why Rollup Instead of Other Bundlers?

While we could use other bundlers like Webpack, esbuild, or Parcel, Rollup is particularly good for libraries because:
- It creates smaller bundles through "tree-shaking" (removing unused code)
- It's simpler to configure than Webpack
- It's specifically designed for libraries rather than applications

Webpack is more commonly used for full applications, while Rollup is often preferred for libraries.

## Technical Details of Our rollup.config.js

Let's break down our configuration:

```js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  // Entry point - where Rollup starts bundling
  input: 'src/index.ts',

  // Don't bundle React - it should come from the user's project
  external: ['react', 'react-dom'],

  // Generate two different bundles
  output: [
    {
      file: 'dist/index.js',     // CommonJS bundle
      format: 'cjs',             // for Node.js and older bundlers
      sourcemap: true            // for debugging
    },
    {
      file: 'dist/index.esm.js', // ES Modules bundle
      format: 'esm',             // for modern bundlers
      sourcemap: true            // for debugging
    }
  ],

  // Tools that help Rollup process our code
  plugins: [
    // Find third-party modules in node_modules
    resolve(),
    
    // Convert CommonJS modules to ES6
    commonjs(),
    
    // Compile TypeScript and generate .d.ts files
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist'
    })
  ]
}
```

### What Each Part Does:

1. **Plugins We Import**:
   - `@rollup/plugin-typescript`: Compiles our TypeScript code
   - `@rollup/plugin-node-resolve`: Helps find modules in node_modules
   - `@rollup/plugin-commonjs`: Converts CommonJS modules to ES6

2. **Entry Point** (`input`):
   - Tells Rollup where our main file is
   - We use 'src/index.ts' which exports our components

3. **External Dependencies** (`external`):
   - Lists packages that shouldn't be bundled
   - React and ReactDOM should come from the user's project

4. **Output Configuration** (`output`):
   - Creates two bundles for different use cases
   - Both include source maps for better debugging
   - CommonJS format (.js) for older systems
   - ES Module format (.esm.js) for modern systems

5. **Plugin Configuration**:
   - `resolve()`: Finds third-party dependencies
   - `commonjs()`: Handles CommonJS modules
   - `typescript()`: Compiles TS and generates type definitions

## In Simple Terms

Our rollup.config.js tells Rollup to:
1. Start from 'src/index.ts' as the main entry point
2. Don't include React and ReactDOM (let users provide their own)
3. Create two bundles in the dist folder:
   - index.js (CommonJS format for older systems)
   - index.esm.js (ES Modules format for modern systems)
4. Include source maps for both files so users can debug issues easily

And it uses three plugins to help with the build:
- typescript: Converts our TypeScript code to JavaScript and creates type definitions (.d.ts files)
- node-resolve: Helps find any third-party code we use from node_modules
- commonjs: Converts any CommonJS modules to ES Modules so everything works together

This way, our library can work with the user's React version, support different systems, and remain debuggable.
