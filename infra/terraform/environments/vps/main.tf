resource "local_file" "ansible_inventory" {
  filename = "${path.module}/generated-inventory.ini"
  content  = <<-EOT
  [platform]
  platform-vps ansible_host=${var.host} ansible_user=${var.ssh_user}
  EOT
}
