# Contact Us - AWS API Gatway and SES 

Contact Us API & email delivery with AWS [API Gateway](https://aws.amazon.com/api-gateway/) and [AWS SES](https://aws.amazon.com/ses/), written with [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

# main [![CircleCI](https://dl.circleci.com/status-badge/img/gh/velles/aws-api-gateway-ses/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/velles/aws-api-gateway-ses/tree/main)


# Deployment Requirements

1. Set up AWS Profile (Recomended but Optional)
The configuration is using `--profile` option with [AWS CLI named profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)

2. Set up [SES Verified Identity(s)](https://docs.aws.amazon.com/ses/latest/dg/verify-addresses-and-domains.html)

3. In `lib/aws-api-gateway-ses-stack.ts` replace `no_reply@your_domain.com` and `recipient@your_domain.com` with your email of prefference. 
The sender `no_reply@your_domain.com` must be an SES Verified Identity.

##  Deploy  
Replace `my-aws-account` with your AWS profile name.
  1. On initial deploy run - `cdk bootstrap --profile my-aws-account`
  2. On subsuquent deploys run - `cdk deploy --profile my-aws-account`

## Tests

`npm test`

## Manual Tests

Use this CURL, replace `AWS-API-GATEWAY-URL` with your coresponign API Gateway link.
It can be found under **Dashboard** in AWS CLI or as the output of the CDK deployment.

- RUN:
```bash
curl --location --request POST 'AWS-API-GATEWAY-URL/live/v1/contact_us' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "John Doe",
  "email": "john@test.com",
  "phone": "818-123-4567",
  "message": "Please contact me. I love your AWS SES integration!"
}'
```

- EMAIL:
```
New Contact US Form Submission

Start of Message
--------------------------------

Name: "John Doe"
Email: "john@test.com" 
Phone: "818-123-4567" 
Message: "Please contact me. I love your AWS SES integration!" 

-------------------------------- 
End of Message
```

## CDK Useful commands

* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
