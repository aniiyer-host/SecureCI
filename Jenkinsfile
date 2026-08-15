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

        echo "=== Normalizing Semgrep findings ==="
        rm -f normalized-sast-findings.json
        python3 scripts/semgrep_parser.py
        echo "=== Generated file ==="
    '''

    archiveArtifacts artifacts: 'normalized-sast-findings.json', fingerprint: true
}
        }

        stage('Dependency Check') {
            steps {
    sh '''
        mkdir -p reports

        npm audit --json > reports/npm-audit-report.json || true

        echo "=== Normalizing npm audit findings ==="

        rm -f normalized-sca-findings.json

        python3 scripts/npm_audit_parser.py

        echo "=== Generated SCA file ==="
        cat normalized-sca-findings.json
    '''

    archiveArtifacts artifacts: 'normalized-sca-findings.json', fingerprint: true
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
            // return true
            return env.BUILD_NUMBER.toInteger() % 10 == 0
        }
    }

    steps {
        sh '''
        set -e

        echo "=== Starting OWASP ZAP ==="

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

        # --------------------------------------------------
        # 1. Wait for ZAP API
        # --------------------------------------------------

        echo "=== Waiting for ZAP API ==="

        ZAP_READY=false

        for i in $(seq 1 60); do
            if docker run --rm \
                --network secureci-network \
                curlimages/curl \
                curl -sf "http://zap-scan:8080/JSON/core/view/version/"
            then
                echo "ZAP API is ready."
                ZAP_READY=true
                break
            fi

            echo "ZAP not ready yet... attempt $i/60"
            sleep 2
        done

        if [ "$ZAP_READY" != "true" ]; then
            echo "ERROR: ZAP failed to become ready."
            docker logs zap-scan || true
            exit 1
        fi

        # --------------------------------------------------
        # 2. Verify ZAP → SecureCI connectivity
        # --------------------------------------------------

        echo "=== Testing ZAP → SecureCI ==="

        docker run --rm \
            --network secureci-network \
            curlimages/curl \
            curl -f \
            "http://zap-scan:8080/JSON/core/action/accessUrl/?url=http://secureci-test:3000/&followRedirects=true"

        echo
        echo "ZAP successfully accessed SecureCI."

        # --------------------------------------------------
        # 3. Start Spider
        # --------------------------------------------------

        echo "=== Starting ZAP Spider ==="

        SPIDER_RESPONSE=$(docker run --rm \
            --network secureci-network \
            curlimages/curl \
            -s \
            "http://zap-scan:8080/JSON/spider/action/scan/?url=http://secureci-test:3000/&recurse=true")

        echo "Spider response: $SPIDER_RESPONSE"

        SPIDER_ID=$(echo "$SPIDER_RESPONSE" | sed -n 's/.*"scan":"\\([^"]*\\)".*/\\1/p')

        if [ -z "$SPIDER_ID" ]; then
            echo "ERROR: Failed to obtain Spider scan ID."
            exit 1
        fi

        echo "Spider scan ID: $SPIDER_ID"

        # --------------------------------------------------
        # 4. Wait for Spider
        # --------------------------------------------------

        echo "=== Waiting for Spider ==="

        SPIDER_COMPLETE=false

        for i in $(seq 1 150); do

            SPIDER_STATUS=$(docker run --rm \
                --network secureci-network \
                curlimages/curl \
                -s \
                "http://zap-scan:8080/JSON/spider/view/status/?scanId=$SPIDER_ID")

            echo "Spider status: $SPIDER_STATUS"

            if echo "$SPIDER_STATUS" | grep -q '"status":"100"'; then
                echo "Spider completed successfully."
                SPIDER_COMPLETE=true
                break
            fi

            sleep 2
        done

        if [ "$SPIDER_COMPLETE" != "true" ]; then
            echo "ERROR: Spider timed out."
            exit 1
        fi

        # --------------------------------------------------
        # 5. Show discovered URLs
        # --------------------------------------------------

        echo "=== URLs discovered by Spider ==="

        docker run --rm \
            --network secureci-network \
            curlimages/curl \
            -s \
            "http://zap-scan:8080/JSON/core/view/urls/"

        echo

        # --------------------------------------------------
        # 6. Start Active Scan
        # --------------------------------------------------

        echo "=== Starting ZAP Active Scan ==="

        ASCAN_RESPONSE=$(docker run --rm \
            --network secureci-network \
            curlimages/curl \
            -s \
            "http://zap-scan:8080/JSON/ascan/action/scan/?url=http://secureci-test:3000/&recurse=true")

        echo "Active scan response: $ASCAN_RESPONSE"

        ASCAN_ID=$(echo "$ASCAN_RESPONSE" | sed -n 's/.*"scan":"\\([^"]*\\)".*/\\1/p')

        if [ -z "$ASCAN_ID" ]; then
            echo "ERROR: Failed to obtain Active Scan ID."
            exit 1
        fi

        echo "Active scan ID: $ASCAN_ID"

        # --------------------------------------------------
        # 7. Wait for Active Scan
        # --------------------------------------------------

        echo "=== Waiting for Active Scan ==="

        ASCAN_COMPLETE=false

        for i in $(seq 1 450); do

            ASCAN_STATUS=$(docker run --rm \
                --network secureci-network \
                curlimages/curl \
                -s \
                "http://zap-scan:8080/JSON/ascan/view/status/?scanId=$ASCAN_ID")

            echo "Active scan status: $ASCAN_STATUS"

            if echo "$ASCAN_STATUS" | grep -q '"status":"100"'; then
                echo "Active scan completed successfully."
                ASCAN_COMPLETE=true
                break
            fi

            sleep 2
        done

        if [ "$ASCAN_COMPLETE" != "true" ]; then
            echo "ERROR: Active scan timed out."
            exit 1
        fi

        # --------------------------------------------------
        # 8. Retrieve ZAP Alerts
        # --------------------------------------------------

        echo "=== Retrieving ZAP Alerts ==="

        docker run --rm \
            --network secureci-network \
            curlimages/curl \
            -s \
            "http://zap-scan:8080/JSON/core/view/alerts/?baseurl=http://secureci-test:3000" \
            > zap-alerts.json

        echo "ZAP alerts saved to zap-alerts.json"

        echo "=== Normalizing ZAP findings ==="
        python3 scripts/zap_parser.py

        echo "=== Normalized findings ==="
        cat normalized-dast-findings.json

        echo
        echo "=== DAST completed successfully ==="
        '''
        archiveArtifacts artifacts: 'zap-alerts.json', fingerprint: true
        archiveArtifacts artifacts: 'normalized-dast-findings.json', fingerprint: true

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
        # trivy image \
        #  --severity HIGH,CRITICAL \
        #   --exit-code 1 \
        #  secureci:${BUILD_NUMBER}
        '''
            }
         }

         stage('SBOM') {
    steps {
        sh '''
    echo "=== Generating SBOM with Syft ==="
    syft secureci:${BUILD_NUMBER} -o syft-json=reports/syft-report.json

    echo "=== Normalizing SBOM ==="

    python3 scripts/syft_parser.py

    echo "=== Generated normalized SBOM ==="
    cat normalized-sbom.json
'''

archiveArtifacts artifacts: 'normalized-sbom.json', fingerprint: true

        archiveArtifacts artifacts: 'reports/sbom.json', fingerprint: true
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

    

