import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class SimpleHauntedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // VPC for RDS and ECS
    // ========================================
    const vpc = new ec2.Vpc(this, 'HauntedVPC', {
      maxAzs: 2,
      natGateways: 1, // Cost optimization: single NAT gateway
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ========================================
    // RDS Postgres Database
    // ========================================
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for RDS Postgres',
      allowAllOutbound: false,
    });

    const dbInstance = new rds.DatabaseInstance(this, 'HauntedDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'haunteddb',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
    });

    // ========================================
    // Lambda Execution Role
    // ========================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant Lambda access to DB secret
    dbInstance.secret?.grantRead(lambdaRole);

    // Grant SSM parameter access for OpenAI API key
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/haunted-home/*`,
      ],
    }));

    // ========================================
    // Lambda Security Group
    // ========================================
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Allow Lambda to connect to RDS
    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to RDS'
    );

    // ========================================
    // Lambda Functions (AI Agents)
    // ========================================
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      environment: {
        DB_SECRET_ARN: dbInstance.secret?.secretArn || '',
        DB_NAME: 'haunteddb',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    };

    // Placeholder Lambda (replace with actual implementations)
    const authLambda = new lambda.Function(this, 'AuthFunction', {
      ...commonLambdaProps,
      handler: 'auth.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Auth endpoint' }),
          };
        };
      `),
    });

    const devicesLambda = new lambda.Function(this, 'DevicesFunction', {
      ...commonLambdaProps,
      handler: 'devices.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Devices endpoint' }),
          };
        };
      `),
    });

    const lightsAgentLambda = new lambda.Function(this, 'LightsAgentFunction', {
      ...commonLambdaProps,
      handler: 'agents/lights.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({ agent: 'lights', commands: [] }),
          };
        };
      `),
    });

    const audioAgentLambda = new lambda.Function(this, 'AudioAgentFunction', {
      ...commonLambdaProps,
      handler: 'agents/audio.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({ agent: 'audio', commands: [] }),
          };
        };
      `),
    });

    // ========================================
    // ECS Cluster for Orchestrator
    // ========================================
    const cluster = new ecs.Cluster(this, 'OrchestratorCluster', {
      vpc,
      containerInsights: true,
    });

    // ECS Task Role
    const taskRole = new iam.Role(this, 'OrchestratorTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    dbInstance.secret?.grantRead(taskRole);
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/haunted-home/*`,
      ],
    }));

    // Allow orchestrator to invoke agent Lambdas
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        lightsAgentLambda.functionArn,
        audioAgentLambda.functionArn,
      ],
    }));

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'OrchestratorTask', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole,
    });

    const orchestratorSecurityGroup = new ec2.SecurityGroup(this, 'OrchestratorSecurityGroup', {
      vpc,
      description: 'Security group for orchestrator container',
      allowAllOutbound: true,
    });

    // Allow orchestrator to connect to RDS
    dbSecurityGroup.addIngressRule(
      orchestratorSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow orchestrator to connect to RDS'
    );

    // Placeholder container (replace with actual image)
    const container = taskDefinition.addContainer('orchestrator', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:20-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'orchestrator',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        DB_SECRET_ARN: dbInstance.secret?.secretArn || '',
        DB_NAME: 'haunteddb',
        LIGHTS_AGENT_ARN: lightsAgentLambda.functionArn,
        AUDIO_AGENT_ARN: audioAgentLambda.functionArn,
      },
      command: ['sh', '-c', 'echo "Orchestrator placeholder" && sleep 3600'],
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // ECS Service with ALB
    const fargateService = new ecs.FargateService(this, 'OrchestratorService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      securityGroups: [orchestratorSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'OrchestratorALB', {
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets('OrchestratorTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [fargateService],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
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
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // Auth endpoints
    const authResource = api.root.addResource('auth');
    authResource.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(authLambda));
    authResource.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(authLambda));

    // Devices endpoints
    const devicesResource = api.root.addResource('devices');
    devicesResource.addMethod('GET', new apigateway.LambdaIntegration(devicesLambda));
    devicesResource.addMethod('POST', new apigateway.LambdaIntegration(devicesLambda));
    devicesResource.addResource('chat').addMethod('POST', new apigateway.LambdaIntegration(devicesLambda));

    // Orchestrator endpoints (proxy to ALB)
    const hauntingResource = api.root.addResource('haunting');
    const httpIntegration = new apigateway.HttpIntegration(`http://${alb.loadBalancerDnsName}/haunting/{proxy}`, {
      httpMethod: 'ANY',
      options: {
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
      proxy: true,
    });

    hauntingResource.addProxy({
      defaultIntegration: httpIntegration,
      anyMethod: true,
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
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'RDS Postgres endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbInstance.secret?.secretArn || '',
      description: 'ARN of the database credentials secret',
    });

    new cdk.CfnOutput(this, 'OrchestratorURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Orchestrator ALB URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend hosting',
    });
  }
}
