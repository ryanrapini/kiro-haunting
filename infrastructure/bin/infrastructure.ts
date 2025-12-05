#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HauntedHomeStack } from '../lib/haunted-home-stack';

const app = new cdk.App();

new HauntedHomeStack(app, 'HauntedHomeStack', {
  env: {
    account: '358414165101',
    region: 'us-east-1',
  },
  description: 'Haunted Home Orchestrator - AI-powered smart home haunting system',
});

app.synth();
