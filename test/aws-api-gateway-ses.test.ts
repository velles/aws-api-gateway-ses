// import * as cdk from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';;
import { AwsApiGatewaySesStack } from '../lib/aws-api-gateway-ses-stack';

test('Empty Stack', () => {
  // Arrange
  const app = new cdk.App();
  const stackProps : any = { 
    configEnv: 'test',
    configServices: {
      dynamodb: {
        default: {
          billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        },
        userProfiles: {
          billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        },
        userDailyMetrics: {
          billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        }
      },
      eventBridge: {
        achievementCompletionEndpoint: "test-endpoint"
      }
    }
  }
  const stack = new AwsApiGatewaySesStack(app, 'MyTestStack', stackProps);
  const template = Template.fromStack(stack);

  // Assert
  // console.log(JSON.stringify(template.toJSON(), null, 4));

  // Check the AWS::ApiGateway::Method resource
  template.hasResourceProperties('AWS::ApiGateway::Method', 
  {
    "HttpMethod": "POST",
    "ResourceId": {
      "Ref": Match.anyValue()
    },
    "RestApiId": {
      "Ref": Match.anyValue()
    },
    "AuthorizationType": "NONE",
    "Integration": {
      "Credentials": {
        "Fn::GetAtt": [
          "SimpleMailServiceRole30AA9A6E",
          "Arn"
        ]
      },
      "IntegrationHttpMethod": "POST",
      "IntegrationResponses": [
        {
          "ResponseParameters": {
            "method.response.header.Access-Control-Allow-Origin": "'*'"
          },
          "ResponseTemplates": {
            "application/json": "{\"message\": \"Email sent!\"}"
          },
          "SelectionPattern": "2\\d{2}",
          "StatusCode": "200"
        },
        {
          "ResponseTemplates": {
            "application/json": "{\"message\": \"Bad request!\"}"
          },
          "SelectionPattern": "4\\d{2}",
          "StatusCode": "400"
        },
        {
          "ResponseTemplates": {
            "application/json": "{\"message\": \"Internal server error!\"}"
          },
          "SelectionPattern": "5\\d{2}",
          "StatusCode": "500"
        }
      ],
      "PassthroughBehavior": "WHEN_NO_TEMPLATES",
      "RequestParameters": {
        "integration.request.header.Content-Type": "'application/x-www-form-urlencoded'"
      },
      "RequestTemplates": {
        "application/json": "Action=SendEmail&Message.Body.Text.Data=$util.urlEncode(\"\n\nNew Contact US Form Submission\n\nStart of Message\r\n--------------------------------\n\nName: $input.json('$.name')\r\nEmail: $input.json('$.email') \r\nPhone: $input.json('$.phone') \r\nMessage: $input.json('$.message') \n\n-------------------------------- \r\nEnd of Message\")&Message.Subject.Data=Contact+form+submission&Destination.ToAddresses.member.1=vel@captainme.ai&Source=vel@captainme.ai"
      },
      "Type": "AWS",
      "Uri": {
        "Fn::Join": [
          "",
          [
            "arn:",
            {
              "Ref": "AWS::Partition"
            },
            ":apigateway:",
            {
              "Ref": "AWS::Region"
            },
            ":email:action/SendEmail"
          ]
        ]
      }
    },
    "MethodResponses": [
      {
        "ResponseParameters": {
          "method.response.header.Access-Control-Allow-Headers": true,
          "method.response.header.Access-Control-Allow-Credentials": true,
          "method.response.header.Access-Control-Allow-Origin": true
        },
        "StatusCode": "200"
      },
      {
        "StatusCode": "400"
      },
      {
        "StatusCode": "500"
      }
    ]
  })

  // Check the AWS::ApiGateway::UsagePlan resource
  template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
    "ApiStages": [
        {
            "ApiId": {
                "Ref":  Match.anyValue()
            },
            "Stage": {
                "Ref": Match.anyValue()
            },
            "Throttle": {}
        }
    ],
    "Description": "Contact Us Form API Plan",
    "Throttle": {
        "BurstLimit": 10,
        "RateLimit": 100
    },
    "UsagePlanName": "ContactUsFormPlan"
  })

  // Check the AWS::ApiGateway::UsagePlanKey resource
  template.hasResourceProperties('AWS::ApiGateway::UsagePlanKey', {
    "KeyId": {
        "Ref":  Match.anyValue()
    },
    "KeyType": "API_KEY",
    "UsagePlanId": {
        "Ref":  Match.anyValue()
    }
  })
});
