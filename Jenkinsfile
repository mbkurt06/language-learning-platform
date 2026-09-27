pipeline {
  agent any

  parameters {
    choice(name: 'DEPLOY_ENV', choices: ['none', 'vps', 'azure'], description: 'Optional deployment target')
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Backend test') {
      steps {
        sh '''
          docker run --rm -v "$PWD/apps/api:/work" -w /work python:3.12-slim sh -c '
            pip install -q ".[dev]" &&
            pytest -q &&
            ruff check app tests
          '
        '''
      }
    }

    stage('Web build') {
      steps {
        sh '''
          docker run --rm -v "$PWD/apps/web:/work" -w /work node:22-alpine sh -c '
            npm install &&
            npm run build
          '
        '''
      }
    }

    stage('Terraform validate') {
      steps {
        sh '''
          docker run --rm -v "$PWD:/work" -w /work hashicorp/terraform:1.9 fmt -check -recursive infra/terraform
          for env in vps azure; do
            docker run --rm -v "$PWD:/work" -w "/work/infra/terraform/environments/$env" hashicorp/terraform:1.9 init -backend=false
            docker run --rm -v "$PWD:/work" -w "/work/infra/terraform/environments/$env" hashicorp/terraform:1.9 validate
          done
        '''
      }
    }

    stage('Ansible syntax') {
      steps {
        sh '''
          docker run --rm -v "$PWD/infra/ansible:/work" -w /work python:3.12-slim sh -c '
            pip install -q ansible-core &&
            ansible-playbook -i inventory.example.ini --syntax-check playbooks/bootstrap.yml
          '
        '''
      }
    }

    stage('Compose validation') {
      steps {
        sh 'cp -n .env.example .env || true; docker compose config >/dev/null'
      }
    }

    stage('Deploy approval') {
      when { expression { params.DEPLOY_ENV != 'none' } }
      steps {
        input message: "Deploy to ${params.DEPLOY_ENV}?", ok: 'Continue'
        echo "Deployment is approval-gated. Environment credentials belong in Jenkins credentials, never Git."
      }
    }
  }

  post {
    always {
      sh 'rm -f .env'
    }
  }
}
