import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SwapALeaseMonitorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const listingsBucket: s3.Bucket = this.createListingsBucket();
    
    const lambdaRole: iam.Role = this.createSwapALeaseMonitorLambndaRole();
    listingsBucket.grantReadWrite(lambdaRole);

    this.createSwapALeaseMonitorLambda(lambdaRole);
  }

  private createSwapALeaseMonitorLambda(executionRole: iam.Role): lambda.Function {
    return new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
      functionName: "HelloFunction",
      description: "Simple hellow world function for testing event bridge connectivity",
      role: executionRole
    });
  }

  private createSwapALeaseMonitorLambndaRole(): iam.Role {
    return new iam.Role(this, "SwapALeaseMonitorRole", {
      roleName: "SwapALeaseMonitorRole",
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess")
      ]
    });
  }

  private createListingsBucket(): s3.Bucket {
    return new s3.Bucket(this, 'SwapALeaseMonitorListingsBucket',{
      bucketName: "swap-a-lease-listings",
      removalPolicy: RemovalPolicy.DESTROY, 
      autoDeleteObjects: true
    });
  }
}


