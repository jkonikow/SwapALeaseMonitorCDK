import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Role, ManagedPolicy, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'

export class SwapALeaseMonitorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const swapALeaseMonitorRole: Role = this.createSwapALeaseMonitorLambdaRole();
    const swapALeaseMonitorLambda = this.createSwapALeaseMonitorLambda(swapALeaseMonitorRole);
    
    const swapALeaseListingsTable = this.createListingsTable();
    swapALeaseListingsTable.grantFullAccess(swapALeaseMonitorRole);
    
    const periodicTrigger: Rule = this.createPeriodicTrigger();
    periodicTrigger.addTarget(new LambdaFunction(swapALeaseMonitorLambda, {
      retryAttempts: 0
    }));
  }

  private createSwapALeaseMonitorLambda(executionRole: Role): Function {
    return new Function(this, 'HelloHandler', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('build/lambda.zip'),
      handler: 'hello.handler',
      functionName: "HelloFunction",
      description: "Simple hello world function for testing event bridge connectivity",
      role: executionRole
    });
  }

  private createSwapALeaseMonitorLambdaRole(): Role {
    return new Role(this, "SwapALeaseMonitorRole", {
      roleName: "SwapALeaseMonitorRole",
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess")
      ]
    });
  }

  private createListingsTable(): Table {
    return new Table(this, 'SwapALeaseListingsTable', {
      partitionKey: {name: "monitorInstanceName", type: AttributeType.STRING},
      tableName: "SwapALeaseListingsTable", 
      removalPolicy: RemovalPolicy.DESTROY
    });
  }

  // todo make hourly after testing
  private createPeriodicTrigger(): Rule {
    return new Rule(this, "ScheduleRule", {
      description: "Periodic trigger for SwapALeaseMonitor",
      ruleName: "SwapALeaseMonitorPeriodicTrigger",
      schedule: Schedule.cron({minute: "0", hour: "4"})
    });
  }
}


