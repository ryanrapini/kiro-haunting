import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class HauntedHomeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables
    // ========================================

    // UserConfig Table
    const userConfigTable = new dynamodb.Table(this, 'UserConfigTable', {
      tableName: 'HauntedHome-UserConfig',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Devices Table
    const devicesTable = new dynamodb.Table(this, 'DevicesTable', {
      tableName: 'HauntedHome-Devices',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'deviceId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // HauntingSessions Table
    const hauntingSessionsTable = new dynamodb.Table(this, 'HauntingSessionsTable', {
      tableName: 'HauntedHome-HauntingSessions',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // Cognito User Pool
    // ========================================

    // Pre-Sign-Up Lambda to auto-confirm users
    const preSignUpLambda = new lambda.Function(this, 'PreSignUpFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          event.response.autoConfirmUser = true;
          event.response.autoVerifyEmail = true;
          return event;
        };
      `),
    });

    const userPool = new cognito.UserPool(this, 'HauntedHomeUserPool', {
      userPoolName: 'HauntedHomeUsers',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: false, // No email verification required
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      lambdaTriggers: {
        preSignUp: preSignUpLambda,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'HauntedHomeUserPoolClient', {
      userPool,
      userPoolClientName: 'HauntedHomeWebClient',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // ========================================
    // Lambda Execution Role
    // ========================================

    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    userConfigTable.grantReadWriteData(lambdaRole);
    devicesTable.grantReadWriteData(lambdaRole);
    hauntingSessionsTable.grantReadWriteData(lambdaRole);

    // Grant SSM parameter access for OpenRouter API key
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/haunted-home/*`,
      ],
    }));

    // ========================================
    // Lambda Functions
    // ========================================

    // Common environment variables for all Lambda functions
    const lambdaEnvironment = {
      USER_CONFIG_TABLE: userConfigTable.tableName,
      DEVICES_TABLE: devicesTable.tableName,
      HAUNTING_SESSIONS_TABLE: hauntingSessionsTable.tableName,
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
    };

    // Config handlers
    const saveConfigLambda = new lambda.Function(this, 'SaveConfigFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.saveConfig',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const getConfigLambda = new lambda.Function(this, 'GetConfigFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.getConfig',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Device handlers
    const deviceChatLambda = new lambda.Function(this, 'DeviceChatFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.deviceChat',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const getDevicesLambda = new lambda.Function(this, 'GetDevicesFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.getDevices',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const deleteDeviceLambda = new lambda.Function(this, 'DeleteDeviceFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.deleteDeviceHandler',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Haunting handlers
    const startHauntingLambda = new lambda.Function(this, 'StartHauntingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.startHaunting',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
    });

    const stopHauntingLambda = new lambda.Function(this, 'StopHauntingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.stopHaunting',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const getNextCommandLambda = new lambda.Function(this, 'GetNextCommandFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.getNextCommand',
      code: lambda.Code.fromAsset('../backend/dist'),
      role: lambdaRole,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // ========================================
    // API Gateway
    // ========================================

    const api = new apigateway.RestApi(this, 'HauntedHomeAPI', {
      restApiName: 'Haunted Home API',
      description: 'API for Haunted Home Orchestrator',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
        ],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // API Resources
    const configResource = api.root.addResource('config');
    configResource.addMethod('GET', new apigateway.LambdaIntegration(getConfigLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    configResource.addMethod('POST', new apigateway.LambdaIntegration(saveConfigLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const devicesResource = api.root.addResource('devices');
    devicesResource.addMethod('GET', new apigateway.LambdaIntegration(getDevicesLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    
    const deviceChatResource = devicesResource.addResource('chat');
    deviceChatResource.addMethod('POST', new apigateway.LambdaIntegration(deviceChatLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const deviceIdResource = devicesResource.addResource('{id}');
    deviceIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteDeviceLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const hauntingResource = api.root.addResource('haunting');
    hauntingResource.addResource('start').addMethod('POST', new apigateway.LambdaIntegration(startHauntingLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    hauntingResource.addResource('stop').addMethod('POST', new apigateway.LambdaIntegration(stopHauntingLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    hauntingResource.addResource('command').addMethod('GET', new apigateway.LambdaIntegration(getNextCommandLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // ========================================
    // S3 Bucket for Frontend
    // ========================================

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ========================================
    // Route 53 Hosted Zone (lookup existing)
    // ========================================

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'kiro-haunting.me',
    });

    // ========================================
    // ACM Certificate (with Route 53 DNS validation)
    // ========================================

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'kiro-haunting.me',
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // ========================================
    // CloudFront Distribution (with custom domain)
    // ========================================

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for Haunted Home frontend',
    });

    frontendBucket.grantRead(originAccessIdentity);

    // Custom cache policy with very low TTL for fast development
    const lowTtlCachePolicy = new cloudfront.CachePolicy(this, 'LowTtlCachePolicy', {
      cachePolicyName: 'HauntedHome-LowTTL',
      comment: 'Low TTL cache policy for fast development updates',
      defaultTtl: cdk.Duration.seconds(10),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.seconds(30),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: lowTtlCachePolicy,
      },
      domainNames: ['kiro-haunting.me'],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(10),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(10),
        },
      ],
    });

    // ========================================
    // Route 53 A Record (point domain to CloudFront)
    // ========================================

    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: 'kiro-haunting.me',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend hosting',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: 'https://kiro-haunting.me',
      description: 'Frontend website URL',
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
      description: 'ACM Certificate ARN',
    });
  }
}
