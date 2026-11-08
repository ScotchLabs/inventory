##############################################
# Terraform: EC2 (2 vCPU / 4GB RAM) + EFS + Docker Compose Postgres
# No ECS. Docker Compose is the entrypoint, run via systemd on boot.
##############################################

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "terraform"
}

##############################################
# Variables
##############################################

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type. t3.medium = 2 vCPU / 4GB RAM"
  type        = string
  default     = "t3.medium"
}

variable "ami_id" {
  description = "AMI for the app instance. Pinned so a newer AL2023 image doesn't force the server to be replaced; change it deliberately."
  type        = string
  default     = "ami-0ac62d2d72afdce51" # the AMI the running instance was built from
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 30
}

variable "key_pair_name" {
  description = "Existing EC2 key pair name for SSH access"
  type        = string
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to SSH into the instance"
  type        = string
  default     = "0.0.0.0/0" # tighten this to your IP in production
}

variable "postgres_db" {
  type    = string
  default = "app"
}

variable "postgres_user" {
  type    = string
  default = "app"
}

variable "postgres_password" {
  description = "Postgres password. Pass via TF_VAR_postgres_password or a .tfvars file, do not hardcode."
  type        = string
  sensitive   = true
}

variable "app_image" {
  description = "Full ECR image URI for your app, e.g. 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:latest. Leave blank to skip the app service."
  type        = string
  default     = ""
}

variable "google_oauth_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_oauth_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "web_root_url" {
  description = "Web frontend root URL (e.g., https://example.com)"
  type        = string
}

variable "api_root_url" {
  description = "API root URL (e.g., https://api.example.com or https://example.com/api)"
  type        = string
}

variable "fastapi_session_secret" {
  description = "FastAPI session secret key"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for Let's Encrypt certificate (e.g., example.com)"
  type        = string
}

##############################################
# Networking - use default VPC/subnet to keep this simple
##############################################

data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_subnet" "selected" {
  id = data.aws_subnets.default.ids[0]
}

##############################################
# Security Group
##############################################

resource "aws_security_group" "app_sg" {
  name_prefix = "app-ec2-sg-"
  description = "SG for app EC2 instance"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_ingress_cidr]
  }

  ingress {
    description = "HTTP for ACME validation"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "app-ec2-sg"
  }
}

resource "aws_security_group" "efs_sg" {
  name        = "app-efs-sg"
  description = "SG for EFS mount targets - allows NFS from the app SG"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "NFS from app instance"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "app-efs-sg"
  }
}

##############################################
# EFS
##############################################

resource "aws_efs_file_system" "data" {
  creation_token   = "app-postgres-data"
  encrypted        = true
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"

  tags = {
    Name = "app-postgres-efs"
  }
}

# Mount target in every AZ covered by default subnets so the instance
# can reach EFS regardless of which subnet it lands in / AZ it's in.
resource "aws_efs_mount_target" "data" {
  for_each        = toset(data.aws_subnets.default.ids)
  file_system_id  = aws_efs_file_system.data.id
  subnet_id       = each.value
  security_groups = [aws_security_group.efs_sg.id]
}

##############################################
# IAM (minimal - just for SSM access, optional but handy)
##############################################

resource "aws_iam_role" "ec2_role" {
  name = "app-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Lets the instance pull images from private ECR repos (read-only:
# GetAuthorizationToken, BatchGetImage, GetDownloadUrlForLayer, etc.)
resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Allow reading secrets from Secrets Manager
resource "aws_iam_role_policy" "secrets_read" {
  name = "app-secrets-read"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = aws_secretsmanager_secret.app_secrets.arn
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "app-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

##############################################
# Secrets Manager - Store sensitive config
##############################################

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "sns-inventory-app-secrets"
  recovery_window_in_days = 7

  tags = {
    Name = "sns-inventory-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    google_oauth_client_id     = var.google_oauth_client_id
    google_oauth_client_secret = var.google_oauth_client_secret
    web_root_url               = var.web_root_url
    api_root_url               = var.api_root_url
    fastapi_session_secret     = var.fastapi_session_secret
    domain_name                = var.domain_name
  })
}

##############################################
# AMI - latest Amazon Linux 2023
##############################################

##############################################
# EC2 Instance
##############################################

resource "aws_instance" "app" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnet.selected.id
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size           = var.root_volume_size_gb
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  # Wait for the EFS mount targets to exist before booting so the
  # user_data mount command has something to connect to.
  depends_on = [aws_efs_mount_target.data]

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    efs_id            = aws_efs_file_system.data.id
    aws_region        = var.aws_region
    aws_account_id    = data.aws_caller_identity.current.account_id
    postgres_db       = var.postgres_db
    postgres_user     = var.postgres_user
    postgres_password = var.postgres_password
    app_image         = var.app_image
    domain_name       = var.domain_name
  })

  tags = {
    Name = "app-postgres-host"
  }
}

##############################################
# Elastic IP - Permanent public IP for the instance
##############################################

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "app-eip"
  }

  depends_on = [aws_instance.app]
}

##############################################
# Outputs
##############################################

output "instance_public_ip" {
  value       = aws_eip.app.public_ip
  description = "Elastic IP (permanent public IP address)"
}

output "instance_public_ip_temporary" {
  value       = aws_instance.app.public_ip
  description = "Temporary public IP (changes on stop/start - use the Elastic IP instead)"
}

output "instance_id" {
  value = aws_instance.app.id
}

output "efs_id" {
  value = aws_efs_file_system.data.id
}

output "ssh_command" {
  value = "ssh -i <your-key>.pem ec2-user@${aws_instance.app.public_ip}"
}


##############################################
# Static site variables and provider
##############################################

variable "static_bucket_name" {
  description = "S3 bucket name for the static site (photos)"
  type        = string
  default     = "sns-photos-static"
}

variable "static_domain_name" {
  description = "Public hostname for the static site, served by CloudFront"
  type        = string
  default     = "static.snstheatre.org"
}

# CloudFront only accepts ACM certificates from us-east-1.
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = "terraform"
}

##############################################
# ----- Static files for snstheatre.org (photos) -----
# Static files for snstheatre.org: S3 bucket behind CloudFront at static.snstheatre.org
# Photos live under images/<gallery-slug>/<file>.jpg, e.g.
#   https://static.snstheatre.org/images/2025_alice_by_heart/IMG_0001.jpg
#
# The bucket is private; CloudFront reads it through Origin Access Control.
##############################################

# CloudFront only accepts ACM certificates from us-east-1.
##############################################
# Variables
##############################################

##############################################
# S3 bucket (private)
##############################################

resource "aws_s3_bucket" "static" {
  bucket = var.static_bucket_name
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket                  = aws_s3_bucket.static.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "static" {
  bucket = aws_s3_bucket.static.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration {
    status = "Enabled" # keeps old copies if a photo is overwritten or deleted by mistake
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Only CloudFront can read objects, and only through this distribution.
resource "aws_s3_bucket_policy" "cloudfront_read" {
  bucket = aws_s3_bucket.static.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontRead"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.static.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.static.arn }
      }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.static]
}

##############################################
# TLS certificate for static.snstheatre.org
##############################################

resource "aws_acm_certificate" "static" {
  provider          = aws.us_east_1
  domain_name       = var.static_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Manual step: add this CNAME in whatever DNS hosts snstheatre.org so the certificate validates.
# The apply will wait until it resolves (see aws_acm_certificate_validation below).
resource "aws_acm_certificate_validation" "static" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.static.arn
}

##############################################
# CloudFront
##############################################

resource "aws_cloudfront_origin_access_control" "static" {
  name                              = "${var.static_bucket_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "static" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "snstheatre.org static files (photos)"
  default_root_object = ""
  aliases             = [var.static_domain_name]
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "s3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.static.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-static"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # AWS managed "CachingOptimized" policy
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.static.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

##############################################
# Outputs
##############################################

output "bucket_name" {
  value = aws_s3_bucket.static.id
}

output "cloudfront_domain_name" {
  description = "Add a CNAME for static.snstheatre.org pointing here in the DNS host for snstheatre.org"
  value       = aws_cloudfront_distribution.static.domain_name
}

output "image_base_url" {
  value = "https://${var.static_domain_name}/images"
}
