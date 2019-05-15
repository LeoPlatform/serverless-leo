'use strict'

const cloneDeep = require('lodash/cloneDeep')
const naming = require('../../node_modules/serverless/lib/plugins/aws/lib/naming')
const srcLeo = require('../../lib/leo')

/* eslint-disable no-template-curly-in-string */
const testServerless = {
  'service': {
    'service': 'hello-serverless-leo-world',
    'serviceObject': {
      'name': 'hello-serverless-leo-world'
    },
    'provider': {
      'stage': 'dev',
      'region': 'us-east-1',
      'variableSyntax': "\\${([ ~:a-zA-Z0-9._@'\",\\-\\/\\(\\)*]+?)}",
      'name': 'aws',
      'runtime': 'nodejs8.10',
      'stackName': 'dev-hello-serverless-leo-world',
      'versionFunctions': true,
      'remoteFunctionData': null,
      'compiledCloudFormationTemplate': {
        'AWSTemplateFormatVersion': '2010-09-09',
        'Description': 'The AWS CloudFormation template for this Serverless application',
        'Resources': {
          'ServerlessDeploymentBucket': {
            'Type': 'AWS::S3::Bucket',
            'Properties': {
              'BucketEncryption': {
                'ServerSideEncryptionConfiguration': [
                  {
                    'ServerSideEncryptionByDefault': {
                      'SSEAlgorithm': 'AES256'
                    }
                  }
                ]
              }
            }
          },
          'HelloNodeWorldLogGroup': {
            'Type': 'AWS::Logs::LogGroup',
            'Properties': {
              'LogGroupName': '/aws/lambda/hello-serverless-leo-world-dev-helloNodeWorld'
            }
          },
          'IamRoleLambdaExecution': {
            'Type': 'AWS::IAM::Role',
            'Properties': {
              'AssumeRolePolicyDocument': {
                'Version': '2012-10-17',
                'Statement': [
                  {
                    'Effect': 'Allow',
                    'Principal': {
                      'Service': [
                        'lambda.amazonaws.com'
                      ]
                    },
                    'Action': [
                      'sts:AssumeRole'
                    ]
                  }
                ]
              },
              'Policies': [
                {
                  'PolicyName': {
                    'Fn::Join': [
                      '-',
                      [
                        'dev',
                        'hello-serverless-leo-world',
                        'lambda'
                      ]
                    ]
                  },
                  'PolicyDocument': {
                    'Version': '2012-10-17',
                    'Statement': [
                      {
                        'Effect': 'Allow',
                        'Action': [
                          'logs:CreateLogStream'
                        ],
                        'Resource': [
                          {
                            'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/hello-serverless-leo-world-dev-helloNodeWorld:*'
                          }
                        ]
                      },
                      {
                        'Effect': 'Allow',
                        'Action': [
                          'logs:PutLogEvents'
                        ],
                        'Resource': [
                          {
                            'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/hello-serverless-leo-world-dev-helloNodeWorld:*:*'
                          }
                        ]
                      }
                    ]
                  }
                }
              ],
              'Path': '/',
              'RoleName': {
                'Fn::Join': [
                  '-',
                  [
                    'hello-serverless-leo-world',
                    'dev',
                    'us-east-1',
                    'lambdaRole'
                  ]
                ]
              }
            }
          },
          'HelloNodeWorldLambdaFunction': {
            'Type': 'AWS::Lambda::Function',
            'Properties': {
              'Code': {
                'S3Bucket': {
                  'Ref': 'ServerlessDeploymentBucket'
                },
                'S3Key': 'serverless/hello-serverless-leo-world/dev/1555513068982-2019-04-17T14:57:48.982Z/helloNodeWorld.zip'
              },
              'FunctionName': 'hello-serverless-leo-world-dev-helloNodeWorld',
              'Handler': 'helloNode.handler',
              'MemorySize': 128,
              'Role': {
                'Fn::GetAtt': [
                  'IamRoleLambdaExecution',
                  'Arn'
                ]
              },
              'Runtime': 'nodejs8.10',
              'Timeout': 10
            },
            'DependsOn': [
              'HelloNodeWorldLogGroup',
              'IamRoleLambdaExecution'
            ]
          },
          'HelloNodeWorldLambdaVersionKpTUdxV6JTBXc6Ov4yd2rTvuXl8ipuUPK69XBRy8': {
            'Type': 'AWS::Lambda::Version',
            'DeletionPolicy': 'Retain',
            'Properties': {
              'FunctionName': {
                'Ref': 'HelloNodeWorldLambdaFunction'
              },
              'CodeSha256': 'lOyHPdWPwDXty7j57wiPOw1XUYmobBw/d0AiCCZCpm4='
            }
          }
        },
        'Outputs': {
          'ServerlessDeploymentBucketName': {
            'Value': {
              'Ref': 'ServerlessDeploymentBucket'
            }
          },
          'HelloNodeWorldLambdaFunctionQualifiedArn': {
            'Description': 'Current Lambda function version',
            'Value': {
              'Ref': 'HelloNodeWorldLambdaVersionKpTUdxV6JTBXc6Ov4yd2rTvuXl8ipuUPK69XBRy8'
            }
          }
        }
      },
      'coreCloudFormationTemplate': {
        'AWSTemplateFormatVersion': '2010-09-09',
        'Description': 'The AWS CloudFormation template for this Serverless application',
        'Resources': {
          'ServerlessDeploymentBucket': {
            'Type': 'AWS::S3::Bucket',
            'Properties': {
              'BucketEncryption': {
                'ServerSideEncryptionConfiguration': [
                  {
                    'ServerSideEncryptionByDefault': {
                      'SSEAlgorithm': 'AES256'
                    }
                  }
                ]
              }
            }
          }
        },
        'Outputs': {
          'ServerlessDeploymentBucketName': {
            'Value': {
              'Ref': 'ServerlessDeploymentBucket'
            }
          }
        }
      },
      'vpc': {}
    },
    'custom': {
      'sand': {
        'leoRegister': 'arn:aws:lambda:us-east-1:123456:function:TestBus-LeoInstallFunction-2IMP25UOQ64G'
      }
    },
    'plugins': [
      'serverless-webpack',
      'serverless-leo'
    ],
    'pluginsData': {},
    'functions': {},
    'layers': {}
  },
  'package': {
    'individually': true,
    'artifactDirectoryName': 'serverless/hello-serverless-leo-world/dev/1555513068982-2019-04-17T14:57:48.982Z',
    'artifact': ''
  }
}
/* eslint-enable no-template-curly-in-string */

module.exports = () => {
  const serverless = cloneDeep(testServerless)

  // hand waved functions
  function getAllFunctions () {
    return Object.keys(serverless.service.functions)
  }

  function getFunction (functionName) {
    return serverless.service.functions[functionName]
  }

  serverless.service.getAllFunctions = getAllFunctions
  serverless.service.getFunction = getFunction

  return Object.assign({
    serverless,
    provider: {
      naming
    }
  }, srcLeo)
}
