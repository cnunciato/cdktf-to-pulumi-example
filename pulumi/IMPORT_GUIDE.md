# Importing Existing Resources

This guide explains how to import the existing AWS resources from your CDKTF deployment into Pulumi.

## Quick Start

The `index.ts` file already includes import statements for most resources. Follow these steps:

### Step 1: Run Pulumi Up

```bash
cd pulumi
pulumi up
```

This will import 6 resources and attempt to create the RouteTableAssociation. Since the association already exists in AWS, you'll see an error like:

```
error: resource already exists (HTTP status 400)
```

This is expected! Continue to Step 2.

### Step 2: Import the RouteTableAssociation

After the initial `pulumi up` fails on the RouteTableAssociation, import it manually:

```bash
pulumi import aws:ec2/routeTableAssociation:RouteTableAssociation routeTableAssociation rtbassoc-07dc07fddc67d40e2 --yes
```

### Step 3: Verify

Run `pulumi up` again to verify everything is in sync:

```bash
pulumi up
```

You should see output indicating that all resources are unchanged.

## Why This Two-Step Process?

The RouteTableAssociation resource has a known issue with Pulumi's import resource option during preview. The association ID validation fails during preview, even though the resource exists. By creating it first (which fails) and then importing it, we work around this limitation.

## Resource IDs from Terraform State

The following resource IDs were extracted from your Terraform state file:

- **VPC**: vpc-0c93187f82665e36d
- **Internet Gateway**: igw-0bb0bb8ae49fc10c3
- **Subnet**: subnet-05d1dbc5a69b0833a
- **Route Table**: rtb-09a220e2a593a8dc6
- **Route Table Association**: rtbassoc-07dc07fddc67d40e2
- **Security Group**: sg-0210d2a2edc68c45e
- **EC2 Instance**: i-0441af6de760e25d7

## Alternative: Manual Import for All Resources

If you prefer to import all resources manually using the `pulumi import` command:

```bash
# Remove all import options from index.ts first, then run:

pulumi import aws:ec2/vpc:Vpc vpc vpc-0c93187f82665e36d --yes
pulumi import aws:ec2/internetGateway:InternetGateway gateway igw-0bb0bb8ae49fc10c3 --yes
pulumi import aws:ec2/subnet:Subnet subnet subnet-05d1dbc5a69b0833a --yes
pulumi import aws:ec2/routeTable:RouteTable routeTable rtb-09a220e2a593a8dc6 --yes
pulumi import aws:ec2/routeTableAssociation:RouteTableAssociation routeTableAssociation rtbassoc-07dc07fddc67d40e2 --yes
pulumi import aws:ec2/securityGroup:SecurityGroup secGroup sg-0210d2a2edc68c45e --yes
pulumi import aws:ec2/instance:Instance server i-0441af6de760e25d7 --yes
```

## Expected Outputs

After successful import, your stack should export:

- `ip`: 35.86.253.232
- `hostname`: ec2-35-86-253-232.us-west-2.compute.amazonaws.com
- `url`: http://ec2-35-86-253-232.us-west-2.compute.amazonaws.com

You can verify the web server is running:

```bash
curl $(pulumi stack output url)
# Should output: Hello, world!
```
