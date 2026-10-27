# Documentation

[Go to Docs](https://github.com/LeoPlatform/serverless-leo/tree/master/src#serverless-leo)

# Compatibility
  serverless-leo version 3 is compatible with serverless@2 and serverless@3

  serverless@1 is not supported

## Examples
[NodeJS](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/nodejs)

[NodeJS Lambda Layer](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/nodejs-lambda-layer)

[Python](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/python)

[Java](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/java-quickstart)

## Starting a new project with example bots
```bash
serverless create --template-url https://github.com/LeoPlatform/serverless-leo/tree/master/templates/microservice -p my-microservice
cd my-microservice
npm install
serverless create bot --name my-bot-name --type load --language node --destination my-write-queue
```

At this point, you will have a new project with a `bots` directory including your new bot. There are two things to setup before your service can be deployed.
1. Set the name and deploymentBucket of your service in the root `serverless.yml` file
2. Update the `leo_config.js` file to include the leo bus values your service will use

## Rust specific
The Rust templates use [rstreams](https://github.com/Chub-Engineering/rstreams-rs) 3.x and `lambda_runtime` 1.x.
1. Add the relative path of the new bot folder to the `members` of your root `Cargo.toml` workspace.
2. rstreams is published to the private `dsco-cargo` Cargo registry. Add that registry to your `.cargo/config.toml` (ask the RStreams maintainers for the index URL) and build with `CARGO_NET_GIT_FETCH_WITH_CLI=true`.
3. The bot reads its bus configuration from the `RSTREAMS_CONFIG` or `RSTREAMS_CONFIG_SECRET` environment variable that serverless-leo sets for the configured bus stack, the same way the Node SDK does, so no bus values go in `main.rs`.

Once you've made these changes, you can run `serverless deploy` which will use your default AWS_PROFILE.

## Developing on this Project Locally
1. Clone project locally
2. Run `npm link` in this project's `/src` directory.
3. In a test project, run `npm link serverless-leo`.
    - At this point, any `serverless` commands will use your local `serverless-leo` plugin

Additionally, if you are making bot template changes, you can temporarily add this to the bottom of `create:bot:copy-template` hook in order to use local path files instead of the repo url.
```js
this.options['template-path'] = path.resolve(`${__dirname}/../templates/bot/${language}/${type}`)
delete this.options['template-url']
```
