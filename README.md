# SecureCI

> **A hands-on DevSecOps pipeline built to understand how modern CI/CD systems integrate security throughout the software delivery lifecycle.**

SecureCI is an educational DevSecOps project that demonstrates how Continuous Integration can be extended with automated security analysis, artifact generation, and security gates.

Rather than focusing solely on tool usage, this project explores the engineering principles behind CI/CD and DevSecOps by integrating testing, static application security testing (SAST), container vulnerability scanning, and automated reporting into a Jenkins pipeline.

---

# Objectives

* Build an end-to-end CI/CD pipeline from scratch
* Understand how modern DevSecOps pipelines are designed
* Integrate security as part of the build process rather than after deployment
* Produce machine-readable and human-readable security evidence
* Learn the purpose of each tool instead of simply using it

---

# Current Pipeline

```text
Developer
    │
git push
    │
GitHub Webhook
    │
Jenkins
    │
Checkout Source
    │
npm ci
    │
Unit Tests (Jest)
    │
Docker Build
    │
Trivy Container Scan
    │
├── JSON Report
├── HTML Report
├── Security Gate
└── Build Artifacts
```

---

# Current Features

## Continuous Integration

* Automated builds triggered through GitHub Webhooks
* Dependency installation using `npm ci`
* Automated unit testing with Jest
* Docker image creation
* Build artifact archiving in Jenkins

---

## Security

### Static Application Security Testing (SAST)

* Semgrep integration *(currently in progress)*
* Detect insecure coding patterns before build
* Source code analysis using AST-based pattern matching

### Container Security

* Docker image vulnerability scanning using Trivy
* Detection of vulnerable OS packages and dependencies
* JSON security reports
* HTML security reports
* Security policy enforcement
* Automated build failure based on vulnerability thresholds

---

## Reporting

The pipeline produces both machine-readable and human-readable reports.

### Machine Readable

* Trivy JSON Reports
* *(Upcoming)* Semgrep JSON Reports

Used for:

* Automation
* Dashboards
* CI/CD systems
* Future integrations

### Human Readable

* Trivy HTML Reports
* *(Upcoming)* Semgrep HTML Reports

Used for:

* Developers
* Security Engineers
* Auditing
* Manual review

---

# Technologies Used

| Category           | Technologies             |
| ------------------ | ------------------------ |
| CI/CD              | Jenkins, GitHub Webhooks |
| Containerization   | Docker                   |
| Source Control     | GitHub                   |
| Testing            | Jest                     |
| SAST               | Semgrep                  |
| Container Security | Trivy                    |
| Tunneling          | ngrok                    |
| Registry           | Docker Hub               |
| Future DAST        | OWASP ZAP                |

---

# Engineering Concepts Covered

This project focuses on understanding the concepts behind DevSecOps, including:

* Continuous Integration (CI)
* Continuous Delivery (CD)
* DevSecOps
* Static Application Security Testing (SAST)
* Software Composition Analysis (SCA)
* Container Security
* Security Gates
* Build Artifacts
* Evidence vs Policy
* Docker Image Security
* Abstract Syntax Trees (AST)
* Structural Pattern Matching
* Automated Security Reporting
* Jenkins Pipelines
* GitHub Webhooks

---

# Project Structure

```text
SecureCI/
│
├── app.js
├── app.test.js
├── Dockerfile
├── Jenkinsfile
├── package.json
├── package-lock.json
│
├── templates/
│   └── html.tpl
│
├── reports/          # Generated during builds (not committed)
│
├── .dockerignore
├── .gitignore
│
└── README.md
```

---

# Project Roadmap

## Completed

* Jenkins Pipeline
* GitHub Webhooks
* Docker Integration
* Jest Unit Testing
* Docker Image Builds
* Trivy Integration
* JSON Security Reports
* HTML Security Reports
* Jenkins Artifact Archiving
* Security Gates
* Build Automation

---

## In Progress

* Semgrep Integration
* SAST Report Generation
* SAST Security Gates
* Jenkins Integration for Semgrep

---

## Planned

* OWASP ZAP (DAST)
* SBOM Generation
* Docker Image Signing
* Supply Chain Security
* Secrets Scanning
* Dependency License Checks
* Deployment Stage
* Runtime Security Monitoring
* GitHub Actions Implementation
* Kubernetes Deployment
* Infrastructure as Code Security
* Security Dashboards

---

# Key Learnings

This project demonstrates how different stages of a DevSecOps pipeline answer different engineering questions:

| Stage   | Question                                          |
| ------- | ------------------------------------------------- |
| Jest    | Does the application work correctly?              |
| Semgrep | Does the source code contain insecure patterns?   |
| Docker  | Can the application be packaged consistently?     |
| Trivy   | Does the container contain known vulnerabilities? |

Each tool provides a different layer of confidence before software is released.

---

# Future Vision

The long-term goal of SecureCI is to evolve into a production-inspired DevSecOps pipeline that combines software quality, application security, supply chain security, and deployment automation into a single continuous delivery workflow.

The emphasis throughout the project is not only on using DevSecOps tools, but on understanding **why each stage exists, what problem it solves, and how the stages work together to improve software security and delivery confidence.**
