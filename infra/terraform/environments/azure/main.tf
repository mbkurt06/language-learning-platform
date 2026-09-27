provider "azurerm" { features {} }

resource "azurerm_resource_group" "platform" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_virtual_network" "platform" {
  name                = "vnet-language-learning"
  address_space       = ["10.20.0.0/16"]
  location            = azurerm_resource_group.platform.location
  resource_group_name = azurerm_resource_group.platform.name
}

resource "azurerm_subnet" "platform" {
  name                 = "snet-platform"
  resource_group_name  = azurerm_resource_group.platform.name
  virtual_network_name = azurerm_virtual_network.platform.name
  address_prefixes     = ["10.20.1.0/24"]
}

resource "azurerm_network_security_group" "platform" {
  name                = "nsg-language-learning"
  location            = azurerm_resource_group.platform.location
  resource_group_name = azurerm_resource_group.platform.name

  security_rule {
    name                       = "ssh"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "http"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_public_ip" "platform" {
  name                = "pip-language-learning"
  location            = azurerm_resource_group.platform.location
  resource_group_name = azurerm_resource_group.platform.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_interface" "platform" {
  name                = "nic-language-learning"
  location            = azurerm_resource_group.platform.location
  resource_group_name = azurerm_resource_group.platform.name

  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.platform.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.platform.id
  }
}

resource "azurerm_network_interface_security_group_association" "platform" {
  network_interface_id      = azurerm_network_interface.platform.id
  network_security_group_id = azurerm_network_security_group.platform.id
}

resource "azurerm_linux_virtual_machine" "platform" {
  name                = "vm-language-learning"
  resource_group_name = azurerm_resource_group.platform.name
  location            = azurerm_resource_group.platform.location
  size                = var.vm_size
  admin_username      = var.admin_username
  network_interface_ids = [azurerm_network_interface.platform.id]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
}
