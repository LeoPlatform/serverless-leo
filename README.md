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
##### nodejs - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/nodejs
##### java - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/java-quickstart
##### python (incomplete) - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/python
