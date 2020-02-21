import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";

const allow = ["shallow-equal"];

const external = Object.keys(pkg.peerDependencies || {});
const allExternal = [
  ...external,
  ...Object.keys(pkg.dependencies || {})
].filter(name => !allow.includes(name));

export default {
  input: "src/index.js",
  external: allExternal,
  plugins: [
    resolve(),
    commonjs({
      include: ["node_modules/**"]
    }),
    babel({
      exclude: "node_modules/**"
    })
  ],
  output: {
    file: pkg.main,
    format: "cjs",
    exports: "named"
  }
};
