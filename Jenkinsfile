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
            when {
              expression {
                 return true
                }
            }
    steps {
        sh '''
        docker rm -f zap-scan || true

        docker run -d \
          --name zap-scan \
          --network secureci-network \
          ghcr.io/zaproxy/zaproxy:stable \
          zap.sh \
          -daemon \
          -host 0.0.0.0 \
          -port 8080 \
          -config 'api.disablekey=true' \
          -config 'api.addrs.addr.name=.*' \
          -config 'api.addrs.addr.regex=true'

        echo "Waiting for ZAP..."
        for i in $(seq 1 30); do
    if docker run --rm \
        --network secureci-network \
        curlimages/curl \
        curl -sf "http://zap-scan:8080/JSON/core/view/version/"
    then
        echo "ZAP API is ready."
        break
    fi

    echo "ZAP not ready yet... attempt $i/30"
    sleep 2
done

        echo "=== Testing ZAP API ==="
        docker run --rm \
          --network secureci-network \
          curlimages/curl \
          curl -f "http://zap-scan:8080/JSON/core/view/version/"

        echo "=== Testing ZAP → SecureCI ==="
        docker run --rm \
          --network secureci-network \
          curlimages/curl \
          curl -f "http://zap-scan:8080/JSON/core/action/accessUrl/?url=http://secureci-test:3000/&followRedirects=true"

        echo "=== ZAP successfully accessed SecureCI ==="

        echo "=== DAST environment ready for manual testing ==="
        echo "secureci-test and zap-scan are alive."
        echo "Sleeping for 5 minutes..."
        sleep 300
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

    

