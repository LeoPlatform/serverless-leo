# serverless-convention
Define your convention in the serverless yml and dynamically include resources.

### Example:
```
custom:
  convention:
    functions:
      folders:
        - api
        - bots
      pattern:
        - '*.yml'
    resources:
      folders:
        - cloudformation
      pattern:
        - '*.yml'
        - '*.js'
        - '*.json'
  included: ${file(./node_modules/serverless-convention/index.js)}
functions:
  - ${self:custom.included.functions}
resources:
  - ${self:custom.included.resources}
```
All yml files in the api and bots folders will be included as functions in the cloudformation. All yml, js, and json files found in the cloudformation folder will also be included.

Optionally, convention objects can be specified with an "asFileArray" flag which will result in an array of relative file references to the files found.
