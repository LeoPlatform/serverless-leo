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
Requires the leo platform (bus) for configuration. https://github.com/LeoPlatform/Leo
##### nodejs
##### java
##### python
