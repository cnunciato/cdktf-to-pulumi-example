# CDKTF to Pulumi Migration

This directory contains the Pulumi TypeScript project converted from the CDKTF project in the parent directory.

## Project Structure

- `index.ts` - Main Pulumi program with all infrastructure resources
- `Pulumi.yaml` - Project configuration
- `Pulumi.dev.yaml` - Stack configuration for the `dev` stack
- `IMPORT_GUIDE.md` - Guide for importing existing AWS resources

## Infrastructure

This project provisions the following AWS resources:

- **VPC** with DNS support and hostnames enabled
- **Internet Gateway** attached to the VPC
- **Subnet** with automatic public IP assignment
- **Route Table** with a route to the internet gateway
- **Route Table Association** linking the subnet to the route table
- **Security Group** allowing HTTP (port 80) inbound and all outbound traffic
- **EC2 Instance** (t3.micro) running a simple Python HTTP server

## Configuration

The project uses the following configuration values:

- `aws:region` - AWS region (default: us-west-2)
- `instanceType` - EC2 instance type (default: t3.micro)
- `vpcNetworkCidr` - VPC CIDR block (default: 10.0.0.0/16)

## Outputs

The stack exports three outputs:

- `ip` - Public IP address of the EC2 instance
- `hostname` - Public DNS hostname of the EC2 instance
- `url` - HTTP URL to access the web server

## Getting Started

### Prerequisites

- Node.js and npm installed
- Pulumi CLI installed
- AWS credentials configured
- Pulumi account (or self-managed backend)

### Installation

```bash
cd pulumi
npm install
```

### Import Existing Resources

If you have existing resources from a CDKTF deployment, see `IMPORT_GUIDE.md` for instructions on importing them.

### Deploy

```bash
pulumi up
```

### Verify

After deployment, you can access the web server:

```bash
curl $(pulumi stack output url)
```

You should see: `Hello, world!`

## Differences from CDKTF

### Configuration

- CDKTF uses `TerraformVariable` for configuration
- Pulumi uses `pulumi.Config()` for configuration

### Outputs

- CDKTF uses `TerraformOutput`
- Pulumi uses `export` statements

### Resource Options

- CDKTF resources don't have built-in import support
- Pulumi resources support the `import` resource option for importing existing resources

### State Management

- CDKTF stores state in Terraform state files
- Pulumi stores state in Pulumi Cloud or a self-managed backend

## Migration Notes

This project was converted from CDKTF with the following changes:

1. Replaced CDKTF constructs with Pulumi equivalents
2. Converted `TerraformVariable` to `pulumi.Config()`
3. Converted `TerraformOutput` to `export` statements
4. Added import resource options for existing AWS resources
5. Maintained the same logical resource names for compatibility

## Next Steps

- Review the code in `index.ts`
- Import existing resources using the guide in `IMPORT_GUIDE.md`
- Run `pulumi up` to verify the configuration
- Consider adding tags, monitoring, or additional security configurations
