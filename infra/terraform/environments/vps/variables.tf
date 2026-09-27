variable "host" {
  description = "Existing VPS public IP or DNS name."
  type        = string
}

variable "ssh_user" {
  description = "SSH user used by Ansible."
  type        = string
  default     = "root"
}
