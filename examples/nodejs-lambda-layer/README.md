# serverless-leo nodejs leo layer example

#### In the /leo/nodejs/ directory
```npm install```
#### Serverless will default this service to be named layer-${stage}. EG layer-test
## Reference layers
By default lambda layers create an export from the stack. EG LeoLambdaLayerQualifiedArn
##### Reference the layer in a lambda from another stack like this:
```
layers:
 - ${cf:layer-${self:provider.stage}.LeoLambdaLayerQualifiedArn}
```

### Exclude dependencies from webpack
In order to shrink the package sizes of lambdas that use a layer, the dependencies that are provided by the layer must be excluded from the webpack config of the lambda that is using it. To do this, use the webpack-node-externals package (https://www.npmjs.com/package/webpack-node-externals).
#### Within the webpack.config.js file externals array for the lambda:
```
externals: [
  'aws-sdk',
  nodeExternals({ modulesDir: '../layer/src/leo/nodejs/node_modules' }),
],
```
The webpack-node-externals package looks through the node_modules directory and excludes what it finds there from the webpack build.
