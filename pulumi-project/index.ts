import * as pulumi from "@pulumi/pulumi";
import { Ec2VirtualMachine } from "./ec2-vm";

// Get configuration values
const config = new pulumi.Config();
const instanceType = config.get("instanceType") || "t3.micro";
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";

// Create the EC2 virtual machine using the component
const vm = new Ec2VirtualMachine("vm", {
    instanceType: instanceType,
    vpcNetworkCidr: vpcNetworkCidr,
});

// Export the instance's publicly accessible IP address, hostname, and URL.
export const ip = vm.publicIp;
export const hostname = vm.publicDns;
export const url = pulumi.interpolate`http://${vm.publicDns}`;
