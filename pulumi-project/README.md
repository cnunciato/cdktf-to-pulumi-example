# CDKTF to Pulumi - EC2 Virtual Machine

This project is a Pulumi TypeScript conversion of the original CDKTF project. It deploys a simple EC2 virtual machine with a web server running on AWS.

## Architecture

The infrastructure consists of:
- **VPC** with DNS support enabled
- **Internet Gateway** for public internet access
- **Public Subnet** with auto-assign public IP
- **Route Table** with route to internet gateway
- **Security Group** allowing HTTP (port 80) inbound traffic
- **EC2 Instance** running Amazon Linux 2 with a simple HTTP server

All resources are encapsulated in a reusable `Ec2VirtualMachine` ComponentResource.

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/install/)
- [Node.js](https://nodejs.org/) (v20.9 or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- Access to Pulumi Cloud (for state management)

## Project Structure

```
pulumi-project/
├── index.ts                 # Main Pulumi program
├── ec2-vm.ts               # Ec2VirtualMachine ComponentResource
├── Pulumi.yaml             # Project configuration
├── Pulumi.dev.yaml         # Dev stack configuration
├── MIGRATION_REPORT.md     # Detailed migration analysis
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Select the Stack

```bash
pulumi stack select dev
```

### 3. Review Configuration

The stack is pre-configured with:
```yaml
config:
  aws:region: us-west-2
  cdktf-to-pulumi:instanceType: t3.micro
  cdktf-to-pulumi:vpcNetworkCidr: 10.0.0.0/16
```

To modify configuration:
```bash
pulumi config set instanceType t3.small
pulumi config set vpcNetworkCidr 10.1.0.0/16
```

### 4. Preview Changes

```bash
pulumi preview
```

This will show that 7 resources will be imported from the existing CDKTF deployment.

### 5. Deploy (Import Resources)

```bash
pulumi up
```

This command will:
- Import all existing AWS resources into Pulumi state
- Create the Pulumi stack and component resource
- Preserve all existing infrastructure (no actual changes to AWS resources)

### 6. View Outputs

```bash
pulumi stack output ip        # Public IP address
pulumi stack output hostname  # Public DNS hostname
pulumi stack output url       # HTTP URL
```

### 7. Test the Application

```bash
curl $(pulumi stack output url)
# Expected output: Hello, world!
```

## Component Resource

The `Ec2VirtualMachine` ComponentResource provides a reusable abstraction for deploying an EC2 instance with networking:

```typescript
import { Ec2VirtualMachine } from "./ec2-vm";

const vm = new Ec2VirtualMachine("my-vm", {
    instanceType: "t3.micro",
    vpcNetworkCidr: "10.0.0.0/16",
});

export const ip = vm.publicIp;
export const dns = vm.publicDns;
```

### Properties

- `instanceType`: EC2 instance type (e.g., `t3.micro`, `t3.small`)
- `vpcNetworkCidr`: CIDR block for the VPC (e.g., `10.0.0.0/16`)

### Outputs

- `publicIp`: The public IP address of the EC2 instance
- `publicDns`: The public DNS hostname of the EC2 instance

## Import Strategy

This project uses Pulumi's `import` resource option to adopt existing infrastructure. Each resource specifies its AWS resource ID:

```typescript
const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
    cidrBlock: args.vpcNetworkCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
}, { 
    parent: this,
    import: "vpc-09bbdc7d272ccfc7e"  // Existing VPC ID from CDKTF
});
```

On first `pulumi up`, these resources will be imported into Pulumi state without any modifications.

## Migration from CDKTF

This project was migrated from CDKTF. Key differences:

| Aspect | CDKTF | Pulumi |
|--------|-------|--------|
| **Language** | TypeScript (generated bindings) | Native TypeScript |
| **State** | S3 + DynamoDB | Pulumi Cloud |
| **Constructs** | CDK Constructs | ComponentResources |
| **Provider** | Terraform AWS Provider | Pulumi AWS Provider |
| **Configuration** | TerraformVariable | pulumi.Config |

See [MIGRATION_REPORT.md](./MIGRATION_REPORT.md) for detailed migration analysis.

## Development

### Type Checking

```bash
npx tsc --noEmit
```

### Code Formatting

```bash
npx prettier --write *.ts
```

### Linting

```bash
npx prettier --check *.ts
```

## Creating Additional Stacks

To create a production stack:

```bash
pulumi stack init prod
pulumi config set aws:region us-west-2
pulumi config set instanceType t3.small
pulumi config set vpcNetworkCidr 10.1.0.0/16
pulumi up
```

Note: The `prod` stack will create new infrastructure (not import existing resources).

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

To remove the stack:

```bash
pulumi stack rm dev
```

## Resources

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Pulumi AWS Provider](https://www.pulumi.com/registry/packages/aws/)
- [Pulumi ComponentResources](https://www.pulumi.com/docs/concepts/resources/components/)
- [Migration Report](./MIGRATION_REPORT.md)

## Support

For issues or questions:
- [Pulumi Community Slack](https://slack.pulumi.com/)
- [Pulumi GitHub Issues](https://github.com/pulumi/pulumi/issues)
