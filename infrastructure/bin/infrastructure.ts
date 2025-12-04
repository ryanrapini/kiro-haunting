#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HauntedHomeStack } from '../lib/haunted-home-stack';

const app = new cdk.App();

new HauntedHomeStack(app, 'HauntedHomeStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Haunted Home Orchestrator - AI-powered smart home haunting system',
});

app.synth();
