COMPOSE=docker compose

.PHONY: up down logs api-test web-build tf-fmt

up:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

api-test:
	cd apps/api && python -m pytest -q

web-build:
	cd apps/web && npm run build

tf-fmt:
	terraform fmt -recursive infra/terraform
