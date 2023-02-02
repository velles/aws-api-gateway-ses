import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface APIGatewayProps extends cdk.StackProps {
  readonly withPlan?: boolean;
};


/** 
* API Gateway
*  In this set up we are using the default stage - 'dev' and an additional stage - 'live'
*  
* More Info on API Gateway Stages Deployment Issue:
*  - https://repost.aws/questions/QUAH1opLNSQVWFFnKpF-1ZTQ/the-problem-of-updating-the-apigateway-stage-in-aws-cdk
*  - https://github.com/aws/aws-cdk/issues/13526
*/
export class ApiGateway extends Construct {
  public readonly IRestApi: apigateway.IRestApi;

  constructor(scope: Construct, id: string, props: APIGatewayProps) {
    super(scope, id);

    const {
      withPlan
    } = props
    /** 
    * API Gateway Instance with default stage - 'dev'
    */
    const endpointsGateway = new apigateway.RestApi(this, 'ApiGatewayContactUs', {
      restApiName: 'ApiGatewayContactUs',
      description: 'Contact Us Form"',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL] // REGIONAL or EDGE
      },
      cloudWatchRole: true,
      deploy: true,
      deployOptions: {
        stageName: 'dev',
        description: "Contact Us Form - Dev stage",
        dataTraceEnabled: true,
        metricsEnabled: false, // Disable CloudWatch metrics
        tracingEnabled: false, // Disable X-ray tracing
        loggingLevel: apigateway.MethodLoggingLevel.INFO
      }
    });

    /*
    *  API Gateway Stages
    *  More Info about "current" deployment per stage: 
    *  - https://repost.aws/questions/QUAH1opLNSQVWFFnKpF-1ZTQ/the-problem-of-updating-the-apigateway-stage-in-aws-cdk
    *  - https://github.com/aws/aws-cdk/issues/13526
    * 
    */
    const liveStageDeployment = new apigateway.Deployment(this,  'ApiGatewayLiveStageDeployment', {
      api: endpointsGateway,
      description: "XPASS 2.0 API Endpoints",
      retainDeployments: true
    })
    // need to change deployment hash to force new deployment
    const FORCE_DEPLOYMENT_LIVE_STAGE = true // IMPORTANT: change this if you want do not want to force new deployment
    if(FORCE_DEPLOYMENT_LIVE_STAGE) {
      liveStageDeployment.addToLogicalId( new Date().toISOString() )

    }

    // "live" Stage
    const liveStage = new apigateway.Stage(this, 'ApiGatewayLiveStage', {
      stageName: 'live',
      description: "Contact Us Form - Live stage",
      deployment: liveStageDeployment,
      dataTraceEnabled: true,
      metricsEnabled: true, // Enable CloudWatch metrics
      tracingEnabled: true, // Enable X-ray tracing
      loggingLevel: apigateway.MethodLoggingLevel.ERROR,
    });

    /**
     * Default Responses for API Gateway
     */ 
    // 4xx response - default 
    endpointsGateway.addGatewayResponse("4xxGatewayResponse", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      templates: {
        'application/json': '{ "message": "Resource not found", "statusCode": "404", "type": "$context.error.responseType" }'
      }
    });

    // Access Denied Response
    endpointsGateway.addGatewayResponse("403GatewayResponse", {
      type: apigateway.ResponseType.ACCESS_DENIED,
      statusCode: '401',
      templates: {
        'application/json': '{ "message": "Access Denied", "statusCode": "401", "type": "$context.error.responseType" }'
      }
    });

    // Authorization failure
    endpointsGateway.addGatewayResponse("GatewayResponse-AUTHORIZER_FAILURE", {
      type: apigateway.ResponseType.AUTHORIZER_FAILURE,
      statusCode: '401',
      templates: {
        'application/json': '{ "message": "Invalid Access Token", "statusCode": "401", "type": "$context.error.responseType" }'
      }
    });

    // Missing Authentication Token
    endpointsGateway.addGatewayResponse("GatewayResponse-UNAUTHORIZED", {
      type: apigateway.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      templates: {
        'application/json': '{ "message": "Access Token Missing", "statusCode": "401", "type": "$context.error.responseType" }'
      }
    });

    // Access Denied Response
    endpointsGateway.addGatewayResponse("GatewayResponse-MISSING_AUTHENTICATION_TOKEN", {
      type: apigateway.ResponseType.MISSING_AUTHENTICATION_TOKEN,
      statusCode: '401',
      templates: {
        'application/json': '{ "message": "Access Token Missing", "statusCode": "401", "type": "$context.error.responseType" }'
      }
    });


    /**
     * Set up Plan and API Key
     */
    if (withPlan) {
      const apiPlan = endpointsGateway.addUsagePlan('ContactUsFormPlan', {
        name: 'ContactUsFormPlan',
        description: 'Contact Us Form API Plan',
        throttle: {
          burstLimit: 10, // requests per second
          rateLimit: 100
        }
      })

      apiPlan.addApiStage({ stage: liveStage })
      const apiKey = new apigateway.ApiKey(this, 'ApiGatewayApiKey', {
        apiKeyName: 'ContactUsFormKey',
        description: 'Contact Us Form API Key',
        enabled: true,
        stages: [liveStage]   
      })

      apiPlan.addApiKey(apiKey)
    }

    this.IRestApi = endpointsGateway
  } 
}
