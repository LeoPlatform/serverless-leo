To execute scripts:

$ AWS_REGION=us-east-1 AWS_PROFILE=entrata-prod node script.js
$ AWS_REGION=us-west-2 AWS_PROFILE=entrata-dev node script.js

If you are using your default ~/.aws/credentials profile, you may omit AWS_PROFILE

And you may omit AWS_REGION if you have set that environment variable.