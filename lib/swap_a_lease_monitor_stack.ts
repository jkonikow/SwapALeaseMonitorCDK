import {Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Role, ManagedPolicy, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {Rule, RuleTargetInput, Schedule} from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import * as dotenv from 'dotenv';

// load the environment vars
dotenv.config();

export class SwapALeaseMonitorStack extends Stack {
  private readonly swapALeaseMonitorLambda: Function;
  private readonly swapALeaseMonitorRole: Role;
  private readonly swapALeaseMonitorListingsTable: Table;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.swapALeaseMonitorRole = this.createSwapALeaseMonitorLambdaRole();
    this.swapALeaseMonitorLambda = this.createSwapALeaseMonitorLambda();
    
    this.swapALeaseMonitorListingsTable = this.createListingsTable();
    this.swapALeaseMonitorListingsTable.grantFullAccess(this.swapALeaseMonitorRole);

    this.createMonitors();
  }

  private createSwapALeaseMonitorLambda(): Function {
    return new Function(this, 'SwapALeaseMonitorLambda', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('build/lambda.zip'),
      handler: 'index.handler',
      functionName: "SwapALeaseMonitorLambda",
      description: "Lambda which monitors SwapALease for new listings",
      timeout: Duration.minutes(1),
      role: this.swapALeaseMonitorRole,
      environment: {
        SENDER_EMAIL: process.env.SENDER_EMAIL!,
        RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL!,
        SES_TEMPLATE_NAME: process.env.SES_TEMPLATE_NAME!,
        SES_CONFIG: process.env.SES_CONFIG!
      }
    });
  }

  private createSwapALeaseMonitorLambdaRole(): Role {
    return new Role(this, "SwapALeaseMonitorRole", {
      roleName: "SwapALeaseMonitorRole",
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonSESFullAccess")
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

  private createMonitors() {
    const economicValue: SwapALeaseMonitorRuleInput = {
      monitorName: "EconomicValue",
      zip: "07645",
      minMilesPerMonth: "1000",
      maxLeasePayment : "320",
      maxMilesFromZip : "100",
      minMonthsRemaining: "12",
      maxMonthsRemaining: "24",
      preferredMakes: []
    }
    this.createMonitorInstance(economicValue);

    const bmwAndAudi: SwapALeaseMonitorRuleInput = {
      monitorName: "BmwAndAudi",
      zip: "07645",
      minMilesPerMonth: "1000",
      maxLeasePayment : "500",
      maxMilesFromZip : "100",
      minMonthsRemaining: "12",
      maxMonthsRemaining: "24",
      preferredMakes: ["BMW", "Audi"]
    }
    this.createMonitorInstance(bmwAndAudi);
  }

  private createMonitorInstance(input: SwapALeaseMonitorRuleInput): Rule {
    const monitor: Rule = new Rule(this, `SwapALeaseMonitorRule-${input.monitorName}`, {
      description: `Periodic trigger for SwapALeaseMonitor-${input.monitorName}`,
      ruleName: `SwapALeaseMonitor-${input.monitorName}`,
      schedule: Schedule.rate(Duration.hours(6)),
      enabled: false
    });

    monitor.addTarget(new LambdaFunction(this.swapALeaseMonitorLambda, {
      retryAttempts: 0,
      event: RuleTargetInput.fromObject(input)
    }));

    return monitor;
  }
}

type SwapALeaseMonitorRuleInput = {
  monitorName: string,
  zip: string,
  minMilesPerMonth: string,
  maxLeasePayment: string,
  maxMilesFromZip: string,
  minMonthsRemaining: string,
  maxMonthsRemaining: string,
  preferredMakes: string[],
};


