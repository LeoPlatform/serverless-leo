# serverless-leo nodejs leo layer example

#### npm install within /leo/nodejs/
### Serverless will default this service to be named layer-${stage}. EG layer-test
### Reference the layers within this stack by using the default exports for lambda layers. EG LeoLambdaLayerQualifiedArn
#### This layer could be referenced like this:
###### layers:
###### - ${cf:layer-${self:provider.stage}.LeoLambdaLayerQualifiedArn}

## To exclude the dependencies within this layer from your other microservices webpack
#### Use the webpack-node-externals package.
#### Within the webpack.config.js file externals array:
#####nodeExternals({ modulesDir: '../layer/src/leo/nodejs/node_modules' })
#### The webpack-node-externals package looks through the node_modules directory and excludes what it finds there from the webpack build.
