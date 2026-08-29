output "instance_public_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_eip.medbooking_eip.public_ip
}

output "ssh_connection_string" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_eip.medbooking_eip.public_ip}"
}

output "instance_id" {
  description = "The ID of the EC2 instance for SSM"
  value       = aws_instance.medbooking_vps.id
}
