import * as cdk from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as SwapALeaseMonitorCdk from '../lib/swap_a_lease_monitor_stack';

let stack: SwapALeaseMonitorCdk.SwapALeaseMonitorStack;

beforeAll(() => {
  stack = new SwapALeaseMonitorCdk.SwapALeaseMonitorStack(new cdk.App(), 'TestStack');
})

test('HelloFunction Created', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: "HelloFunction"
    });
});

test('ListingsTable Created', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: "SwapALeaseListingsTable"
    })
});

test('Lambda Role Created', () => {
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::IAM::Role', {
    RoleName: "SwapALeaseMonitorRole"
  })
});
