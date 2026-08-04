variable "aws_region" {
  description = "The AWS region to deploy the VPS"
  type        = string
  default     = "ap-southeast-1"
}

variable "instance_type" {
  description = "The EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Name of an existing AWS KeyPair to enable SSH access to the instance"
  type        = string
  # Replace with your actual key pair name in AWS, or set it via terraform.tfvars
  default     = "my-aws-key"
}

variable "runner_ip" {
  description = "Dynamic IP of the GitHub Actions runner for SSH access"
  type        = string
  default     = "0.0.0.0/32"
}
