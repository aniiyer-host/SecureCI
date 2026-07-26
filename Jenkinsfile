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
                trivy image \
                --severity HIGH,CRITICAL \
                --exit-code 1 \
                secureci:${BUILD_NUMBER}
                '''
            }
        }

    }
}