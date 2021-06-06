const path = require('path');
const slsw = require("serverless-webpack");

module.exports = (async () => {
  return {
    entry: slsw.lib.entries,
    externals: ["aws-sdk"],
    mode: slsw.lib.webpack.isLocal ? "development" : "production",
    module: {
      rules: [
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        {
          exclude: [
            [
              path.resolve(__dirname, ".serverless"),
              path.resolve(__dirname, ".webpack"),
            ],
          ],
          loader: "ts-loader",
          options: {
            experimentalWatchApi: true,
            transpileOnly: true,
          },
          test: /\.(tsx?)$/,
        },
      ],
    },
    optimization: {
      minimize: false, // We do not want to minimize our code. Easier to fix in lambda console.
    },
    output: {
      filename: "[name].js",
      libraryTarget: "commonjs",
      path: path.join(__dirname, ".webpack"),
    },
    resolve: {
      cacheWithContext: false,
      extensions: [".mjs", ".json", ".ts", ".js"],
      symlinks: false,
    },
    target: "node"
  };
})();
