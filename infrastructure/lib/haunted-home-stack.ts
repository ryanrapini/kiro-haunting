import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Add GSI for querying active sessions
    hauntingSessionsTable.addGlobalSecondaryIndex({
      indexName: 'ActiveSessionsIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'isActive',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================
    // Cognito User Pool
    // ========================================

    const userPool = new cognito.UserPool(this, 'HauntedHomeUserPool', {
      userPoolName: 'HauntedHomeUsers',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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

    // Grant SSM parameter access for OpenAI API key
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/haunted-home/*`,
      ],
    }));

    // ========================================
    // Placeholder Lambda Functions
    // ========================================

    // These will be replaced with actual implementations from ../backend/
    const placeholderLambda = new lambda.Function(this, 'PlaceholderFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Placeholder function' }),
          };
        };
      `),
      role: lambdaRole,
      environment: {
        USER_CONFIG_TABLE: userConfigTable.tableName,
        DEVICES_TABLE: devicesTable.tableName,
        HAUNTING_SESSIONS_TABLE: hauntingSessionsTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
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
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // API Resources (placeholders for now)
    const authResource = api.root.addResource('auth');
    authResource.addMethod('POST', new apigateway.LambdaIntegration(placeholderLambda));

    const configResource = api.root.addResource('config');
    configResource.addMethod('GET', new apigateway.LambdaIntegration(placeholderLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    configResource.addMethod('POST', new apigateway.LambdaIntegration(placeholderLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const devicesResource = api.root.addResource('devices');
    devicesResource.addMethod('GET', new apigateway.LambdaIntegration(placeholderLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    devicesResource.addMethod('POST', new apigateway.LambdaIntegration(placeholderLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const hauntingResource = api.root.addResource('haunting');
    hauntingResource.addResource('start').addMethod('POST', new apigateway.LambdaIntegration(placeholderLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    hauntingResource.addResource('stop').addMethod('POST', new apigateway.LambdaIntegration(placeholderLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    hauntingResource.addResource('command').addMethod('GET', new apigateway.LambdaIntegration(placeholderLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // ========================================
    // S3 Bucket for Frontend
    // ========================================

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `haunted-home-frontend-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================
    // Route 53 & Certificate Manager
    // ========================================
    // Note: This requires manual setup of the hosted zone first
    // Uncomment and configure after domain is set up

    /*
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'kiro-haunting.me',
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'kiro-haunting.me',
      subjectAlternativeNames: ['*.kiro-haunting.me'],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // ========================================
    // CloudFront Distribution
    // ========================================

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: ['kiro-haunting.me'],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Route 53 Records
    new route53.ARecord(this, 'FrontendAliasRecord', {
      zone: hostedZone,
      recordName: 'kiro-haunting.me',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    new route53.ARecord(this, 'APIAliasRecord', {
      zone: hostedZone,
      recordName: 'api.kiro-haunting.me',
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
    });
    */

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

    new cdk.CfnOutput(this, 'UserConfigTableName', {
      value: userConfigTable.tableName,
      description: 'DynamoDB UserConfig table name',
    });

    new cdk.CfnOutput(this, 'DevicesTableName', {
      value: devicesTable.tableName,
      description: 'DynamoDB Devices table name',
    });

    new cdk.CfnOutput(this, 'HauntingSessionsTableName', {
      value: hauntingSessionsTable.tableName,
      description: 'DynamoDB HauntingSessions table name',
    });
  }
}
