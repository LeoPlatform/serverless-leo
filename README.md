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
  hello:
    handler: index.handler
    events:
      - leo: helloWorldTestQueue
  
  world:
    handler: index.handler
    leoCron: 0 0 1 * * * 
```

## Deploy your microservice
Use the standard `serverless deploy` cli command to deploy your microservice. Optional -s or -stage parameter (standard serverless).

## Examples
Requires the leo platform (bus). Step 2 in this guide: https://github.com/LeoPlatform/Leo#install-the-leo-platform-stack
##### Nodejs - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/nodejs
##### Java - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/java-quickstart
##### Python (incomplete) - https://github.com/LeoPlatform/serverless-leo/tree/master/examples/python

## Documentation
### Trigger lambdas from a Leo queue
Create a "bot" that will run when events are added to a queue. The events will be handled in order and only one lambda will handle events at a time.
```
hello:
  handler: index.handler
  events:
    - leo: helloWorldTestQueue
```
You can specify multiple queues for a single lambda. Each will become a separate bot, visible in the bus ui (Botmon).
##### Name bots
You can define the queue as an object and give the bot a name. Otherwise the name of the bot will be the name of the lambda plus the queue.
```
hello:
  handler: index.handler
  events:
    - leo: 
        queue: helloWorldTestQueue
        name: helloBot
```

### Trigger lambdas on a schedule
Create a "bot" that will run on a cron schedule. Only one lambda will run at any given time for a single bot.
```
world:
  handler: index.handler
  leoCron: 0 0 1 * * * 
```
The bot will be named the same as the lambda.

### Variations
Handle different versions of bot by adding "botCount". This will create the number of bots specified and pass in "botNumber" into the event when the bot is ran.
```
world:
  handler: index.handler
  leoCron: 0 0 1 * * * 
  botCount: 4
```
This allows you to partition the queue, or change the configuration of the bot based on the value of the variable at run time.
