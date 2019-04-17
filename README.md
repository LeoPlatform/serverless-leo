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
    # The name of your leo platform stack
    leoStack: TestBus
  test:
    # The arn for the LeoInstallFunction lambda in your leo platform stack.
    # This is an alternative to using the leoStack variable. EG: the bus and lambda are in different accounts.
    leoRegister: arn:aws:lambda:us-east-1:123456:function:TestBus-LeoInstallFunction-2IMP25UOQ64G

functions:
  helloWorld:
    handler: index.handler
    leo:
      source: helloWorldTestQueue
```

## Deploy your microservice
Use the standard `serverless deploy` cli command to deploy your microservice. Optional -s or -stage parameter (standard serverless).

## Examples
Requires the leo platform (bus). Step 2 in this guide: https://github.com/LeoPlatform/Leo#install-the-leo-platform-stack
##### Nodejs - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/nodejs
##### Java - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/java-quickstart
##### Python (incomplete) - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/python
