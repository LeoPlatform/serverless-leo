# serverless-leo
Serverless plugin. Deploy your leo bots and microservices using serverless.

## Install serverless-leo
npm install --save-dev serverless-leo

## Configure serverless.yml
```
plugins:
  - serverless-leo

functions:
  helloWorld:
    handler: index.handler
    leo:
      source: helloWorldTestQueue
```

## Examples
##### nodejs
##### java
##### python
