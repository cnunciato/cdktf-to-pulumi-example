import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, TerraformVariable, S3Backend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Ec2VirtualMachine } from "./ec2-vm";

class MyStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const region = "us-west-2";

        // Configure the backend.
        new S3Backend(this, {
            bucket: "cdktf-to-pulumi-tfstate",
            key: `cdktf-to-pulumi-tfstate/terraform.${id}.tfstate`,
            dynamodbTable: "tfstate-locks",
            encrypt: true,
            region,
        });


        // Configure AWS Provider.
        new AwsProvider(this, "aws", {
            region,
        });

        // Define configuration variables
        const instanceType = new TerraformVariable(this, "instanceType", {
            type: "string",
            default: "t3.micro",
            description: "EC2 instance type",
        });

        const vpcNetworkCidr = new TerraformVariable(this, "vpcNetworkCidr", {
            type: "string",
            default: "10.0.0.0/16",
            description: "VPC network CIDR",
        });

        // Create the EC2 virtual machine using the construct
        const vm = new Ec2VirtualMachine(this, "vm", {
            instanceType: instanceType.stringValue,
            vpcNetworkCidr: vpcNetworkCidr.stringValue,
        });

        // Export the instance's publicly accessible IP address, hostname, and URL.
        new TerraformOutput(this, "ip", {
            value: vm.publicIp,
        });

        new TerraformOutput(this, "hostname", {
            value: vm.publicDns,
        });

        new TerraformOutput(this, "url", {
            value: `http://${vm.publicDns}`,
        });
    }
}

const app = new App();
new MyStack(app, "dev");
new MyStack(app, "prod");
app.synth();
