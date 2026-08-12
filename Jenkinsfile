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
            --network secureci-network \
            -p 3000:3000 \
            secureci:latest
            '''
            }
        }

        stage('Wait for Application') {
            steps {
              sh '''
              echo "Waiting for application..."

              until curl -fs http://secureci-test:3000 > /dev/null
              do
                sleep 2
              done

              echo "Application is ready."
              '''
            }
        }

        stage('DAST - OWASP ZAP') {
            steps {
            sh '''
        mkdir -p reports

        # Remove any previous scanner container
        docker rm -f zap-scan || true

        # Create the ZAP container
        docker create \
          --name zap-scan \
          --network secureci-network \
          -v "$PWD/reports:/zap/wrk" \
          ghcr.io/zaproxy/zaproxy:stable \
          zap-baseline.py \
            -t http://secureci-test:3000 \
            -r zap-report.html \
            -J zap-report.json
    

        #Verify DNS
        docker run --rm \
            --network secureci-network \
            curlimages/curl \
            curl http://secureci-test:3000
        
        # Run the scan
        docker start -a zap-scan || true

        # Copy reports back into the Jenkins workspace
        docker cp zap-scan:/zap/wrk/zap-report.html reports/ || true
        docker cp zap-scan:/zap/wrk/zap-report.json reports/ || true

        # Optional: copy the generated automation plan
        docker cp zap-scan:/zap/wrk/zap.yaml reports/ || true

        # Clean up
        docker rm -f zap-scan || true
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
                sh '''
                docker rm -f zap-scan || true
                docker rm -f secureci-test || true
                '''
                archiveArtifacts artifacts: 'reports/*', fingerprint: true
            }
        }
}

    

