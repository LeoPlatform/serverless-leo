# serverless-leo
Serverless plugin. Deploy your leo bots and microservices using serverless.

## Install serverless-leo
npm install --save-dev serverless-leo

## Configure serverless.yml
```
plugins:
  - serverless-leo

custom:
  stage: ${opt:stage, 'dev'}
  dev:
    leoStack: TestBus
  test:
    leoStack: TestBus

functions:
  helloWorld:
    handler: index.handler
    leo:
      source: helloWorldTestQueue
```

## Deploy your microservice
Use the standard `serverless deploy` cli command to deploy your microservice. Optional -s or -stage parameter (standard serverless).

## Examples
Requires the leo platform (bus) for configuration. https://github.com/LeoPlatform/Leo
##### nodejs
##### java
##### python
