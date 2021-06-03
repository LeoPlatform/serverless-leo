const slsw = require("serverless-webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = (async () => {
  return {
    entry: slsw.lib.entries,
    optimization: {
      minimize: false, // We no not want to minimize our code. Easier to fix in lambda console.
    },
    target: "node",
    mode: slsw.lib.webpack.isLocal ? "development" : "production",
    externals: ["aws-sdk"],
  };
})();
