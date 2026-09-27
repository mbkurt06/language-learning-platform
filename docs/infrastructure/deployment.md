# Deployment Model

## Local

The current German engine can continue running on the host at port 8765 while the new platform runs in Docker.

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- Platform API: http://localhost:8000
- PostgreSQL: internal Docker network only
- German engine: reached through `host.docker.internal:8765`

This is transitional. The engine will later receive its own production container image and join the same private network.

## Existing VPS

Terraform's VPS environment deliberately treats a VPS as an input rather than coupling the platform to one hosting provider. It generates an Ansible inventory.

```bash
terraform -chdir=infra/terraform/environments/vps init
terraform -chdir=infra/terraform/environments/vps apply -var='host=YOUR_HOST'
ansible-playbook -i infra/terraform/environments/vps/generated-inventory.ini infra/ansible/playbooks/bootstrap.yml
```

Secrets are not committed. The production `.env` must be injected by a secret manager or CI credentials.

## Azure

The Azure Terraform environment provisions a Linux VM, network, subnet, public IP and NSG. The same Ansible bootstrap and Docker Compose deployment can then be used.

The Azure environment intentionally requires `allowed_ssh_cidr`; SSH should not be open to the entire Internet.

## CI/CD

GitHub Actions validates pull requests. Jenkins is included for a second, production-oriented pipeline and future controlled deployments.

Jenkins deployment stages are approval-gated. Terraform apply and cloud/VPS changes should never happen automatically on every commit.
