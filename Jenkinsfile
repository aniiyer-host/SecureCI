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

        stage('Dependency Check') {
            steps {
                sh '''
                 mkdir -p reports

                 set +e
                 npm audit --json > reports/npm-audit-report.json
                 AUDIT_EXIT=$?
                 echo "npm audit exited with code $AUDIT_EXIT"
                 set -e
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

        stage('Start Test Container') {
            steps {
                sh '''
                docker rm -f secureci-test || true

                docker run -d \
                --name secureci-test \
                -p 3000:3000 \
                secureci:latest
                '''
            }
        }

        stage('Wait for Application') {
            steps {
              sh '''
              echo "Waiting for application..."

              until curl -fs http://localhost:3000 > /dev/null
              do
                sleep 2
              done

              echo "Application is ready."
              '''
            }
        }

        stage('OWASP ZAP Baseline') {
            steps {
              sh '''
              mkdir -p reports

              docker run --rm \
                --network host \
                -v "$PWD/reports:/zap/wrk" \
                ghcr.io/zaproxy/zaproxy:stable \
                zap-baseline.py \
                -t http://localhost:3000 \
                -J zap-report.json \
                -r zap-report.html
             '''
            }
        }

        stage('Stop Test Container') {
            steps {
             sh '''
             docker rm -f secureci-test || true
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

    

