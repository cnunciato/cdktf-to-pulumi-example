import { Construct } from "constructs";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Instance } from "@cdktf/provider-aws/lib/instance";

export interface Ec2VirtualMachineProps {
    instanceType: string;
    vpcNetworkCidr: string;
}

export class Ec2VirtualMachine extends Construct {
    public readonly publicIp: string;
    public readonly publicDns: string;

    constructor(scope: Construct, id: string, props: Ec2VirtualMachineProps) {
        super(scope, id);

        // Look up the latest Amazon Linux 2 AMI.
        const ami = new DataAwsAmi(this, "ami", {
            mostRecent: true,
            owners: ["amazon"],
            filter: [
                {
                    name: "name",
                    values: ["amzn2-ami-hvm-*"],
                },
            ],
        });

        // Create a VPC.
        const vpc = new Vpc(this, "vpc", {
            cidrBlock: props.vpcNetworkCidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
        });

        // Create an internet gateway.
        const gateway = new InternetGateway(this, "gateway", {
            vpcId: vpc.id,
        });

        // Create a subnet that automatically assigns new instances a public IP address.
        const subnet = new Subnet(this, "subnet", {
            vpcId: vpc.id,
            cidrBlock: "10.0.1.0/24",
            mapPublicIpOnLaunch: true,
        });

        // Create a route table.
        const routeTable = new RouteTable(this, "routeTable", {
            vpcId: vpc.id,
            route: [
                {
                    cidrBlock: "0.0.0.0/0",
                    gatewayId: gateway.id,
                },
            ],
        });

        // Associate the route table with the public subnet.
        new RouteTableAssociation(this, "routeTableAssociation", {
            subnetId: subnet.id,
            routeTableId: routeTable.id,
        });

        // Create a security group allowing inbound access over port 80 and outbound access to anywhere.
        const secGroup = new SecurityGroup(this, "secGroup", {
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
        });

        // Create and launch an EC2 instance into the public subnet.
        const server = new Instance(this, "server", {
            ami: ami.id,
            instanceType: props.instanceType,
            subnetId: subnet.id,
            vpcSecurityGroupIds: [secGroup.id],
            userData: [
                "#!/bin/bash",
                "echo 'Hello, world!' > index.html",
                "nohup python -m SimpleHTTPServer 80 &"
            ].join("\n"),
        });

        // Expose the instance's publicly accessible IP address and hostname.
        this.publicIp = server.publicIp;
        this.publicDns = server.publicDns;
    }
}
