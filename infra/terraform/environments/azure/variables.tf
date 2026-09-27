variable "location" { type = string; default = "germanywestcentral" }
variable "resource_group_name" { type = string; default = "rg-language-learning" }
variable "vm_size" { type = string; default = "Standard_B2s" }
variable "admin_username" { type = string; default = "platform" }
variable "ssh_public_key" { type = string; sensitive = true }

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR allowed to reach SSH. Do not use 0.0.0.0/0 in production."
}
