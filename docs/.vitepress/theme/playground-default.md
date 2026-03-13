---
pages: 1
style:
  font-size: 11pt
vars:
  tagline: 'Full-Stack Engineering · Distributed Systems · Cloud Infrastructure'
---

# Adrian Sterling

<adrian.sterling@email.com> | [in/adriansterling](https://linkedin.com/in/adriansterling) | [adriansterling](https://github.com/adriansterling) | [adriansterling.dev](https://adriansterling.dev)

{{ tagline }}

## Education

### Stanford University || Sept 2018 - June 2022

**_B.S. Computer Science, Summa Cum Laude_** || Stanford, CA

- GPA: 3.92 | Dean's List (all quarters) | CS Department Outstanding Senior Award
- Teaching Assistant for CS 144 (Networking) and CS 245 (Database Systems)
- President, ACM Student Chapter, organized 12 industry speaker events reaching 500+ students

## Work Experience

### Meta || Aug 2023 - Present

_Senior Software Engineer, Infrastructure Platform_ || Menlo Park, CA

- Designed task orchestration platform serving 2M+ jobs/day across 200 services, 73% fewer failed deploys
- Led migration of 12 services from AWS to GCP, saving $1.8M/yr while improving p99 latency 40%
- Built real-time anomaly detection pipeline with `Kafka` and `Flink`, catching 94% of incidents before user impact

### Stripe || June 2022 - July 2023

_Software Engineer, Payments Core_ || San Francisco, CA

- Implemented idempotent retry logic for payments, eliminating 99.7% of duplicate charges (50M+ txns/day)
- Optimized critical-path database queries, improving checkout API response times from 320ms to 85ms (p95)
- Built load testing framework adopted by 8 teams, surfaced 3 capacity bottlenecks before Black Friday

### Google || May 2021 - Aug 2021

_Software Engineering Intern, Search Quality_ || Mountain View, CA

- Built data pipeline processing 10TB/day of search quality signals using `Go` and `BigQuery`
- Shipped A/B test framework adopted by 3 teams, reducing experiment setup time from 2 weeks to 2 days
- Presented results to VP of Search, pipeline promoted to production for 2 ranking signals

### Palantir || June 2020 - Aug 2020

_Software Engineering Intern, Forward Deployed_ || Palo Alto, CA

- Built geospatial visualization module in `TypeScript` and `D3.js` for defense logistics platform
- Reduced analyst data processing workflow from 4 hours to 15 minutes with custom ETL pipeline

## Projects

### CloudTask: Distributed Task Scheduler

- Built fault-tolerant job scheduler with exactly-once semantics using `React`, `FastAPI`, `PostgreSQL`, and `Redis`
- Handles 500K+ scheduled tasks with automatic retry, dead-letter queues, and real-time monitoring
- [GitHub](https://github.com/adriansterling/cloudtask) | [Live Demo](https://cloudtask.example.com)

### AI Code Assistant

- VS Code extension with tree-sitter AST analysis for context-aware completions, 92% suggestion accuracy
- 1,200+ Marketplace installations, 4.8★ rating, featured in VS Code Weekly Newsletter

### Kōji: Open-Source Commit Linter

- CLI and GitHub Action enforcing Conventional Commits across 40+ repos, 15K+ weekly npm downloads
- [GitHub](https://github.com/adriansterling/koji) | [npm](https://npmjs.com/package/koji)

## Awards

### Winner, PennApps XXIII Hackathon || Nov 2021

- Led 4-person team to build `React Native` triage app with `Firebase` backend in 48 hours, adopted by 2 clinics

### Finalist, Google Code Jam || Aug 2020

- Top 500 out of 30,000+ participants in algorithmic programming competition

### Stanford TreeHacks, Best Developer Tool || Jan 2020

- Built real-time collaborative debugging tool using WebSockets and `Monaco Editor`

## Technical Skills

Languages
: TypeScript, Go, Python, Java, SQL, GraphQL

Frameworks & Libraries
: React, Next.js, Node.js, FastAPI, Spring Boot, gRPC

Databases
: PostgreSQL, Redis, DynamoDB, BigQuery, Elasticsearch

Cloud & Infrastructure
: AWS, GCP, Kubernetes, Docker, Terraform, Kafka, Datadog
