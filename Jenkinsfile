pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Semgrep SAST') {
            steps {
                sh '''
                mkdir -p reports
                /opt/semgrep-venv/bin/semgrep scan . \
                --json \
                --output reports/semgrep-report.json
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build \
                -t secureci:${BUILD_NUMBER} \
                -t secureci:latest .
                '''
            }
        }

        stage('Trivy Image Scan') {
    steps {
        sh '''
        mkdir -p reports

        # Generate JSON report
        trivy image \
          --severity HIGH,CRITICAL \
          --format json \
          --output reports/trivy-report.json \
          secureci:${BUILD_NUMBER}

        # Generate HTML report
        trivy image \
          --severity HIGH,CRITICAL \
          --format template \
          --template "@templates/html.tpl" \
          --output reports/trivy-report.html \
          secureci:${BUILD_NUMBER}

        # Enforce security policy
        trivy image \
          --severity HIGH,CRITICAL \
          --exit-code 1 \
          secureci:${BUILD_NUMBER}
        '''
            }
         }
        }

        post {
        always {
            archiveArtifacts artifacts: 'reports/*', fingerprint: true
        }
    }
}

    

