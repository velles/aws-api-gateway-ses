import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ApiGateway } from './constructs/api-gateway';

export class AwsApiGatewaySesStack extends cdk.Stack {
  constructor(app: Construct, id: string, props?: cdk.StackProps) {
    super(app, id, props);

    // Gest the default AWS Env variables from cdk.json
    const config = app.node.tryGetContext('config');
    const region = cdk.Stack.of(this).region // Extract Dynamicly from CLI profile
    // const account = cdk.Stack.of(this).account // Extract Dynamicly from CLI profile

    /*
     * SES Integration
     *  - 
     *  - Add API Gateway Method with Integration
     */

    // NOTE: - Change `no_reply@your_domain.com` to the email you want to send from and you have
    //         registered in the AWS SES console.
    //       - Also change `recipient@your_domain.com` to the email you want to send to.
    const jsonRequestTemplate = [
      'Action=SendEmail',
      `Message.Body.Text.Data=$util.urlEncode("\n
New Contact US Form Submission\n
Start of Message\r
--------------------------------\n
Name: $input.json('$.name')\r
Email: $input.json('$.email') \r
Phone: $input.json('$.phone') \r
Message: $input.json('$.message') \n
-------------------------------- \r
End of Message")`,
      'Message.Subject.Data=Contact+form+submission',
      'Destination.ToAddresses.member.1=recipient@your_domain.com',
      'Source=no_reply@your_domain.com'
    ].join('&')

    // Set up a role for SES integration
    const sesIntegrationRole = new iam.Role(this, 'SimpleMailServiceRole',{
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });

    sesIntegrationRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['ses:SendEmail']
    }));

    // Docs: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.AwsIntegrationProps.html
    const sesIntegration = new apigateway.AwsIntegration({
      service: 'email', // NOTE: - This is the SES service name
      action: 'SendEmail',
      region: region,
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: sesIntegrationRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestParameters: {
          'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
        },
        requestTemplates: {
          'application/json': jsonRequestTemplate
        },
        integrationResponses: [
          {
            statusCode: '200',
            selectionPattern: '2\\d{2}',
            responseTemplates: {
              'application/json': '{"message": "Email sent!"}'
            }
          },
          {
            statusCode: '400',
            selectionPattern: '4\\d{2}',
            responseTemplates: {
              'application/json': '{"message": "Bad request!"}'
            },
          },
          {
            statusCode: '500',
            selectionPattern: '5\\d{2}',
            responseTemplates: {
              'application/json': '{"message": "Internal server error!"}'
            },
          }
        ]
      }
    })

    /*
     * API GATEWAY
     *  - Add API Gateway Resources
     *  - Add API Gateway Method with Integration
     */
    const apiGateway = new ApiGateway(this, 'apiGatewayInstance', { 
      config
    })
    // API Gateway Namespace - v1 - optional
    const v1GatewayAPINamespace = apiGateway.IRestApi.root.addResource('v1'); 
    const contactUsResource = v1GatewayAPINamespace.addResource('contact_us');
    // Contact US Endpoint - POST /v1/contact_us
    contactUsResource.addMethod(
      'POST',
      sesIntegration, // Add the SES Integration as the Mothod destination
      {
        methodResponses: [
          { statusCode: "200" }, 
          { statusCode: "400" },
          { statusCode: "500" }
        ]
      }
    )
  }
}
