# Documentation

[Go to Docs](https://github.com/LeoPlatform/serverless-leo/tree/master/src#serverless-leo)

## Examples
[NodeJS](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/nodejs)

[NodeJS Lambda Layer](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/nodejs-lambda-layer)

[Python](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/python)

[Java](https://github.com/LeoPlatform/serverless-leo/tree/master/examples/java-quickstart)

## Developing Locally
1. Clone project locally
2. Run `npm link` in this project's `/src` directory.
3. In a test project, run `npm link serverless-leo`.
    - At this point, any `serverless` commands will use your local `serverless-leo` plugin

Additionally, if you are making template changes, you can temporarily add this to the bottom of `create:bot:copy-template` hook in order to use local path files instead of the repo url.
```js
this.options['template-path'] = path.resolve(`${__dirname}/../templates/bot/${language}/${type}`)
delete this.options['template-url']
```