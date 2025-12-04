import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class UltraSimpleHauntedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // VPC for RDS (minimal setup)
    // ========================================
    const vpc = new ec2.Vpc(this, 'HauntedVPC', {
      maxAzs: 2,
      natGateways: 0, // No NAT Gateway! Use VPC Endpoints instead
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Endpoints for AWS services (replaces NAT Gateway)
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    vpc.addInterfaceEndpoint('SQSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
    });

    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
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
    // DynamoDB for WebSocket Connections
    // ========================================
    const connectionsTable = new dynamodb.Table(this, 'WebSocketConnections', {
      tableName: 'HauntedHome-WebSocketConnections',
      partitionKey: {
        name: 'connectionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // GSI for querying by userId
    connectionsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // ========================================
    // SQS Queue for Command Streaming
    // ========================================
    const commandQueue = new sqs.Queue(this, 'CommandQueue', {
      queueName: 'haunted-home-commands',
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(1),
    });

    // Dead letter queue for failed messages
    const deadLetterQueue = new sqs.Queue(this, 'CommandDLQ', {
      queueName: 'haunted-home-commands-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    commandQueue.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      actions: ['sqs:SendMessage'],
      resources: [commandQueue.queueArn],
    }));

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

    // Grant permissions
    dbInstance.secret?.grantRead(lambdaRole);
    connectionsTable.grantReadWriteData(lambdaRole);
    commandQueue.grantSendMessages(lambdaRole);
    commandQueue.grantConsumeMessages(lambdaRole);

    // Grant Polly access for voice synthesis
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['polly:SynthesizeSpeech'],
      resources: ['*'],
    }));

    // Grant SSM parameter access for OpenAI API key
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/haunted-home/*`,
      ],
    }));

    // Grant Lambda invocation for orchestrator calling agents
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [`arn:aws:lambda:${this.region}:${this.account}:function:haunted-*`],
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
    // Common Lambda Props
    // ========================================
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Use public subnet since no NAT Gateway
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      environment: {
        DB_SECRET_ARN: dbInstance.secret?.secretArn || '',
        DB_NAME: 'haunteddb',
        CONNECTIONS_TABLE: connectionsTable.tableName,
        COMMAND_QUEUE_URL: commandQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    };

    // ========================================
    // Lambda Functions
    // ========================================

    // Auth Lambda
    const authLambda = new lambda.Function(this, 'AuthFunction', {
      ...commonLambdaProps,
      functionName: 'haunted-auth',
      handler: 'auth.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Auth request:', event);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
              message: 'Auth endpoint',
              token: 'mock-jwt-token'
            }),
          };
        };
      `),
    });

    // Devices Lambda
    const devicesLambda = new lambda.Function(this, 'DevicesFunction', {
      ...commonLambdaProps,
      functionName: 'haunted-devices',
      handler: 'devices.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Devices request:', event);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
              message: 'Devices endpoint',
              devices: []
            }),
          };
        };
      `),
    });

    // AI Agent Lambdas
    const lightsAgentLambda = new lambda.Function(this, 'LightsAgentFunction', {
      ...commonLambdaProps,
      functionName: 'haunted-agent-lights',
      handler: 'agents/lights.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Lights agent invoked:', event);
          // Call OpenAI API here
          return {
            commands: [
              { text: 'Alexa, turn living room lights red', deviceId: 'light-1' },
              { text: 'Alexa, dim bedroom lights to 20 percent', deviceId: 'light-2' }
            ]
          };
        };
      `),
    });

    const audioAgentLambda = new lambda.Function(this, 'AudioAgentFunction', {
      ...commonLambdaProps,
      functionName: 'haunted-agent-audio',
      handler: 'agents/audio.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Audio agent invoked:', event);
          return {
            commands: [
              { text: 'Alexa, play spooky sounds on kitchen speaker', deviceId: 'speaker-1' }
            ]
          };
        };
      `),
    });

    const tvAgentLambda = new lambda.Function(this, 'TVAgentFunction', {
      ...commonLambdaProps,
      functionName: 'haunted-agent-tv',
      handler: 'agents/tv.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('TV agent invoked:', event);
          return {
            commands: [
              { text: 'Alexa, turn on living room TV', deviceId: 'tv-1' }
            ]
          };
        };
      `),
    });

    const plugAgentLambda = new lambda.Function(this, 'PlugAgentFunction', {
      ...commonLambdaProps,
      functionName: 'haunted-agent-plug',
      handler: 'agents/plug.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Plug agent invoked:', event);
          return {
            commands: [
              { text: 'Alexa, turn off bedroom lamp', deviceId: 'plug-1' }
            ]
          };
        };
      `),
    });

    // Orchestrator Lambda
    const orchestratorLambda = new lambda.Function(this, 'OrchestratorFunction', {
      ...commonLambdaProps,
      functionName: 'haunted-orchestrator',
      handler: 'orchestrator.handler',
      timeout: cdk.Duration.seconds(300), // 5 minutes for orchestration
      environment: {
        ...commonLambdaProps.environment,
        LIGHTS_AGENT_ARN: lightsAgentLambda.functionArn,
        AUDIO_AGENT_ARN: audioAgentLambda.functionArn,
        TV_AGENT_ARN: tvAgentLambda.functionArn,
        PLUG_AGENT_ARN: plugAgentLambda.functionArn,
      },
      code: lambda.Code.fromInline(`
        const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
        const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
        
        const lambda = new LambdaClient({});
        const sqs = new SQSClient({});
        
        exports.handler = async (event) => {
          console.log('Orchestrator invoked:', event);
          
          const body = JSON.parse(event.body || '{}');
          const { userId, sessionId, devices } = body;
          
          // Group devices by type
          const devicesByType = {
            light: devices.filter(d => d.type === 'light'),
            speaker: devices.filter(d => d.type === 'speaker'),
            tv: devices.filter(d => d.type === 'tv'),
            smart_plug: devices.filter(d => d.type === 'smart_plug'),
          };
          
          // Invoke agent Lambdas in parallel
          const agentPromises = [];
          
          if (devicesByType.light.length > 0) {
            agentPromises.push(
              lambda.send(new InvokeCommand({
                FunctionName: process.env.LIGHTS_AGENT_ARN,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({ devices: devicesByType.light, userId, sessionId })
              }))
            );
          }
          
          if (devicesByType.speaker.length > 0) {
            agentPromises.push(
              lambda.send(new InvokeCommand({
                FunctionName: process.env.AUDIO_AGENT_ARN,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({ devices: devicesByType.speaker, userId, sessionId })
              }))
            );
          }
          
          // Wait for all agents to respond
          const results = await Promise.all(agentPromises);
          
          // Parse commands from agent responses
          const allCommands = [];
          for (const result of results) {
            const payload = JSON.parse(Buffer.from(result.Payload).toString());
            allCommands.push(...payload.commands);
          }
          
          // Send commands to SQS queue for streaming
          for (const command of allCommands) {
            await sqs.send(new SendMessageCommand({
              QueueUrl: process.env.COMMAND_QUEUE_URL,
              MessageBody: JSON.stringify({
                userId,
                sessionId,
                command: command.text,
                deviceId: command.deviceId,
                timestamp: Date.now()
              })
            }));
          }
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
              message: 'Haunting started',
              commandsGenerated: allCommands.length
            }),
          };
        };
      `),
    });

    // Grant orchestrator permission to invoke agents
    lightsAgentLambda.grantInvoke(orchestratorLambda);
    audioAgentLambda.grantInvoke(orchestratorLambda);
    tvAgentLambda.grantInvoke(orchestratorLambda);
    plugAgentLambda.grantInvoke(orchestratorLambda);

    // WebSocket Handler Lambda
    const wsHandlerLambda = new lambda.Function(this, 'WebSocketHandler', {
      ...commonLambdaProps,
      functionName: 'haunted-websocket-handler',
      handler: 'websocket.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
        const dynamodb = new DynamoDBClient({});
        
        exports.handler = async (event) => {
          console.log('WebSocket event:', event);
          const { connectionId, routeKey } = event.requestContext;
          
          if (routeKey === '$connect') {
            // Store connection
            const userId = event.queryStringParameters?.userId || 'anonymous';
            await dynamodb.send(new PutItemCommand({
              TableName: process.env.CONNECTIONS_TABLE,
              Item: {
                connectionId: { S: connectionId },
                userId: { S: userId },
                ttl: { N: String(Math.floor(Date.now() / 1000) + 3600) } // 1 hour TTL
              }
            }));
            return { statusCode: 200, body: 'Connected' };
          }
          
          if (routeKey === '$disconnect') {
            // Remove connection
            await dynamodb.send(new DeleteItemCommand({
              TableName: process.env.CONNECTIONS_TABLE,
              Key: { connectionId: { S: connectionId } }
            }));
            return { statusCode: 200, body: 'Disconnected' };
          }
          
          return { statusCode: 200, body: 'OK' };
        };
      `),
    });

    // Command Streamer Lambda (processes SQS and sends to WebSocket)
    const commandStreamerLambda = new lambda.Function(this, 'CommandStreamer', {
      ...commonLambdaProps,
      functionName: 'haunted-command-streamer',
      handler: 'streamer.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
        const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
        const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
        
        const dynamodb = new DynamoDBClient({});
        const polly = new PollyClient({});
        
        exports.handler = async (event) => {
          console.log('Processing commands from SQS:', event);
          
          for (const record of event.Records) {
            const message = JSON.parse(record.body);
            const { userId, command, deviceId } = message;
            
            // Synthesize speech with Polly
            const pollyResponse = await polly.send(new SynthesizeSpeechCommand({
              Text: command,
              OutputFormat: 'mp3',
              VoiceId: 'Joanna', // Female voice
              Engine: 'neural' // Better quality
            }));
            
            // Convert audio stream to base64
            const audioBuffer = await streamToBuffer(pollyResponse.AudioStream);
            const audioBase64 = audioBuffer.toString('base64');
            
            // Find WebSocket connections for this user
            const connections = await dynamodb.send(new QueryCommand({
              TableName: process.env.CONNECTIONS_TABLE,
              IndexName: 'UserIdIndex',
              KeyConditionExpression: 'userId = :userId',
              ExpressionAttributeValues: {
                ':userId': { S: userId }
              }
            }));
            
            // Send to all user's connections
            const wsEndpoint = process.env.WEBSOCKET_ENDPOINT;
            const apiGw = new ApiGatewayManagementApiClient({
              endpoint: wsEndpoint
            });
            
            for (const item of connections.Items || []) {
              const connectionId = item.connectionId.S;
              try {
                await apiGw.send(new PostToConnectionCommand({
                  ConnectionId: connectionId,
                  Data: JSON.stringify({
                    type: 'command',
                    text: command,
                    deviceId,
                    audio: audioBase64,
                    timestamp: Date.now()
                  })
                }));
              } catch (error) {
                console.error('Failed to send to connection:', connectionId, error);
              }
            }
          }
          
          return { statusCode: 200 };
        };
        
        async function streamToBuffer(stream) {
          const chunks = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          return Buffer.concat(chunks);
        }
      `),
    });

    // Connect SQS to streamer Lambda
    commandStreamerLambda.addEventSource(new SqsEventSource(commandQueue, {
      batchSize: 10,
    }));

    // ========================================
    // WebSocket API Gateway
    // ========================================
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'WebSocketAPI', {
      apiName: 'HauntedHomeWebSocket',
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', wsHandlerLambda),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', wsHandlerLambda),
      },
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Grant WebSocket API permission to invoke Lambda
    wsHandlerLambda.addPermission('WebSocketInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*`,
    });

    // Update streamer Lambda with WebSocket endpoint
    commandStreamerLambda.addEnvironment('WEBSOCKET_ENDPOINT', webSocketStage.url);

    // Grant streamer permission to post to WebSocket connections
    commandStreamerLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [`arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*`],
    }));

    // ========================================
    // REST API Gateway
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

    // Haunting endpoints
    const hauntingResource = api.root.addResource('haunting');
    hauntingResource.addResource('start').addMethod('POST', new apigateway.LambdaIntegration(orchestratorLambda));
    hauntingResource.addResource('stop').addMethod('POST', new apigateway.LambdaIntegration(orchestratorLambda));

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
      description: 'REST API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'WebSocketEndpoint', {
      value: webSocketStage.url,
      description: 'WebSocket API endpoint URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'RDS Postgres endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbInstance.secret?.secretArn || '',
      description: 'ARN of the database credentials secret',
    });

    new cdk.CfnOutput(this, 'CommandQueueUrl', {
      value: commandQueue.queueUrl,
      description: 'SQS Command Queue URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend hosting',
    });
  }
}
