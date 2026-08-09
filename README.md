# SecureCI

> **A hands-on DevSecOps pipeline built to understand how modern CI/CD systems integrate security throughout the software delivery lifecycle.**

SecureCI is a learning-first DevSecOps project that demonstrates how Continuous Integration can be extended with automated testing, security analysis, container security, artifact generation, and security gates.

Rather than treating security tools as black boxes, SecureCI focuses on understanding the engineering principles behind each integration — why the tool exists, what problem it solves, how it interacts with the CI/CD environment, and how security evidence flows toward a release decision.

---

# Objectives

- Build an end-to-end CI/CD pipeline from scratch
- Understand how modern DevSecOps pipelines are designed
- Integrate security directly into the software delivery lifecycle
- Produce machine-readable and human-readable security evidence
- Understand the difference between security findings and release policy
- Learn the infrastructure concepts behind CI/CD tooling rather than simply using tools

---

# Current Architecture

```text
                         Developer
                             │
                          git push
                             │
                    GitHub Webhook
                             │
                          Jenkins
                             │
                     ┌───────┴───────┐
                     │               │
              Install Dependencies  │
                     │               │
                ┌────┴────┐          │
                │         │          │
              Jest     Semgrep   npm audit
                │         │          │
                └────┬────┴──────────┘
                     │
                Docker Build
                     │
              Start Test Container
                     │
              secureci-network
                ┌────┴────┐
                │         │
          Application     ZAP
                │         │
                └────┬────┘
                     │
                Trivy Scan
                     │
              Security Evidence
                     │
              Release Decision
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
* Semgrep JSON Reports
* npm audit JSON Reports

Used for:

* Automation
* Dashboards
* CI/CD systems
* Future integrations

### Human Readable

* Trivy HTML Reports

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
| DAST               | OWASP ZAP                |

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

* Refinement of ZAP report generation
* Improved DAST integration
* Security policy separation from individual scanning tools

---

## Planned

* ZAP REST API integration
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
# Challenges Faced
* While implementing OWASP DAST normally by running another Docker Image:- In a Docker-outside-of-Docker architecture, bind mounts are resolved by the Docker daemon, not by the container invoking docker run. Paths that exist inside the Jenkins container may not correspond to writable locations from the daemon's perspective. This can result in unexpected ownership and permissions inside downstream containers, even when the invoking container sees different permissions.

---
# Known Limitations
* In a Docker-outside-of-Docker setup on OrbStack/macOS, bind mounts originating from the Jenkins container may be materialized by the host daemon with different ownership than expected. This prevents the ZAP wrapper from writing reports to /zap/wrk, even though the directory is mounted. Networking remains fully functional; the issue is isolated to filesystem ownership during report generation.

---

# Future Vision

The long-term goal of SecureCI is to evolve into a production-inspired DevSecOps pipeline that combines software quality, application security, supply chain security, and deployment automation into a single continuous delivery workflow.

The emphasis throughout the project is not only on using DevSecOps tools, but on understanding and implementation **why each stage exists, what problem it solves, and how the stages work together to improve software security and delivery confidence.**
