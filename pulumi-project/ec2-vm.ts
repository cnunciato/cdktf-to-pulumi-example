import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface Ec2VirtualMachineArgs {
    instanceType: pulumi.Input<string>;
    vpcNetworkCidr: pulumi.Input<string>;
}

export class Ec2VirtualMachine extends pulumi.ComponentResource {
    public readonly publicIp: pulumi.Output<string>;
    public readonly publicDns: pulumi.Output<string>;

    constructor(
        name: string,
        args: Ec2VirtualMachineArgs,
        opts?: pulumi.ComponentResourceOptions
    ) {
        super("custom:ec2:VirtualMachine", name, {}, opts);

        // Look up the latest Amazon Linux 2 AMI.
        const ami = aws.ec2.getAmi(
            {
                mostRecent: true,
                owners: ["amazon"],
                filters: [
                    {
                        name: "name",
                        values: ["amzn2-ami-hvm-*"],
                    },
                ],
            },
            { parent: this }
        );

        // Create a VPC.
        const vpc = new aws.ec2.Vpc(
            `${name}-vpc`,
            {
                cidrBlock: args.vpcNetworkCidr,
                enableDnsHostnames: true,
                enableDnsSupport: true,
            },
            {
                parent: this,
                import: "vpc-09bbdc7d272ccfc7e",
            }
        );

        // Create an internet gateway.
        const gateway = new aws.ec2.InternetGateway(
            `${name}-gateway`,
            {
                vpcId: vpc.id,
            },
            {
                parent: this,
                import: "igw-0d34816a5f2c5a29f",
            }
        );

        // Create a subnet that automatically assigns new instances a public IP address.
        const subnet = new aws.ec2.Subnet(
            `${name}-subnet`,
            {
                vpcId: vpc.id,
                cidrBlock: "10.0.1.0/24",
                mapPublicIpOnLaunch: true,
            },
            {
                parent: this,
                import: "subnet-0f1569c2a01ec0e58",
            }
        );

        // Create a route table.
        const routeTable = new aws.ec2.RouteTable(
            `${name}-routeTable`,
            {
                vpcId: vpc.id,
                routes: [
                    {
                        cidrBlock: "0.0.0.0/0",
                        gatewayId: gateway.id,
                    },
                ],
            },
            {
                parent: this,
                import: "rtb-0b3679a8e8f25dba2",
            }
        );

        // Associate the route table with the public subnet.
        new aws.ec2.RouteTableAssociation(
            `${name}-routeTableAssociation`,
            {
                subnetId: subnet.id,
                routeTableId: routeTable.id,
            },
            {
                parent: this,
                import: "rtbassoc-07d344d06046b7950",
            }
        );

        // Create a security group allowing inbound access over port 80 and outbound access to anywhere.
        const secGroup = new aws.ec2.SecurityGroup(
            `${name}-secGroup`,
            {
                description: "Enable HTTP access",
                vpcId: vpc.id,
                ingress: [
                    {
                        fromPort: 80,
                        toPort: 80,
                        protocol: "tcp",
                        cidrBlocks: ["0.0.0.0/0"],
                    },
                ],
                egress: [
                    {
                        fromPort: 0,
                        toPort: 0,
                        protocol: "-1",
                        cidrBlocks: ["0.0.0.0/0"],
                    },
                ],
            },
            {
                parent: this,
                import: "sg-07393f6b4285e6f74",
            }
        );

        // Create and launch an EC2 instance into the public subnet.
        const server = new aws.ec2.Instance(
            `${name}-server`,
            {
                ami: pulumi.output(ami).apply((a) => a.id),
                instanceType: args.instanceType,
                subnetId: subnet.id,
                vpcSecurityGroupIds: [secGroup.id],
                userData: [
                    "#!/bin/bash",
                    "echo 'Hello, world!' > index.html",
                    "nohup python -m SimpleHTTPServer 80 &",
                ].join("\n"),
            },
            {
                parent: this,
                import: "i-0969532ee5f2e2e4b",
            }
        );

        // Expose the instance's publicly accessible IP address and hostname.
        this.publicIp = server.publicIp;
        this.publicDns = server.publicDns;

        this.registerOutputs({
            publicIp: this.publicIp,
            publicDns: this.publicDns,
        });
    }
}
