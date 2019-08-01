# serverless-leo nodejs leo layer example

#### In the /leo/nodejs/ directory
```npm install```
#### Serverless will default this service to be named layer-${stage}. EG layer-test
## Reference layers
By default lambda layers create an export from the stack. EG LeoLambdaLayerQualifiedArn
##### This layer could be referenced by a lambda within another stack like this:
```
layers:
 - ${cf:layer-${self:provider.stage}.LeoLambdaLayerQualifiedArn}
```

## Exclude dependencies from webpack
In order to exclude dependencies form the webpack use the webpack-node-externals package (https://www.npmjs.com/package/webpack-node-externals).
#### Within the webpack.config.js file externals array:
```
externals: [
  'aws-sdk',
  nodeExternals({ modulesDir: '../layer/src/leo/nodejs/node_modules' }),
],
```
##### The webpack-node-externals package looks through the node_modules directory and excludes what it finds there from the webpack build.
