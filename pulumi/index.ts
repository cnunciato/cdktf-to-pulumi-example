import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get configuration values
const config = new pulumi.Config();
const instanceType = config.get("instanceType") || "t3.micro";
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";

// Look up the latest Amazon Linux 2 AMI
const ami = aws.ec2.getAmi({
    mostRecent: true,
    owners: ["amazon"],
    filters: [
        {
            name: "name",
            values: ["amzn2-ami-hvm-*"],
        },
    ],
});

// Create a VPC
// Import existing resource: vpc-0c93187f82665e36d
const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: vpcNetworkCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
}, {
    import: "vpc-0c93187f82665e36d",
});

// Create an internet gateway
// Import existing resource: igw-0bb0bb8ae49fc10c3
const gateway = new aws.ec2.InternetGateway("gateway", {
    vpcId: vpc.id,
}, {
    import: "igw-0bb0bb8ae49fc10c3",
});

// Create a subnet that automatically assigns new instances a public IP address
// Import existing resource: subnet-05d1dbc5a69b0833a
const subnet = new aws.ec2.Subnet("subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
}, {
    import: "subnet-05d1dbc5a69b0833a",
});

// Create a route table
// Import existing resource: rtb-09a220e2a593a8dc6
const routeTable = new aws.ec2.RouteTable("routeTable", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: gateway.id,
        },
    ],
}, {
    import: "rtb-09a220e2a593a8dc6",
});

// Associate the route table with the public subnet
// NOTE: RouteTableAssociation import has issues during preview.
// After running pulumi up with the other resources, import this manually:
// pulumi import aws:ec2/routeTableAssociation:RouteTableAssociation routeTableAssociation rtbassoc-07dc07fddc67d40e2
const routeTableAssociation = new aws.ec2.RouteTableAssociation("routeTableAssociation", {
    subnetId: subnet.id,
    routeTableId: routeTable.id,
});

// Create a security group allowing inbound access over port 80 and outbound access to anywhere
// Import existing resource: sg-0210d2a2edc68c45e
const secGroup = new aws.ec2.SecurityGroup("secGroup", {
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
}, {
    import: "sg-0210d2a2edc68c45e",
});

// Create and launch an EC2 instance into the public subnet
// Import existing resource: i-0441af6de760e25d7
const server = new aws.ec2.Instance("server", {
    ami: ami.then(ami => ami.id),
    instanceType: instanceType,
    subnetId: subnet.id,
    vpcSecurityGroupIds: [secGroup.id],
    userData: [
        "#!/bin/bash",
        "echo 'Hello, world!' > index.html",
        "nohup python -m SimpleHTTPServer 80 &"
    ].join("\n"),
}, {
    import: "i-0441af6de760e25d7",
});

// Export the instance's publicly accessible IP address, hostname, and URL
export const ip = server.publicIp;
export const hostname = server.publicDns;
export const url = pulumi.interpolate`http://${server.publicDns}`;
