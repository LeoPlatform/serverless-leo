# serverless-leo - AI-Assisted Development Guide

## Overview

**serverless-leo** is a Serverless Framework plugin for Leo microservices. It enables deploying Leo bots and microservices using the Serverless Framework, integrating with the Leo Platform (RStreams) for event-driven processing.

- **Primary branch**: master
- **Main code**: src/
- **Package root**: src/ (package.json lives here)

---

## Repository Structure

- src/ - Plugin source code (index.js, lib/, test/)
- templates/ - Scaffolding (microservice, bot/node, bot/typescript, bot/rust)
- examples/ - Example projects (nodejs, python, java)

---

## Key Concepts

### Leo Bots
- Load: Read from source queue, process, write to destination queue
- Enrich: Enrich data from a queue
- Offload: Read from queue and offload elsewhere

### Configuration
- custom.leoStack: Leo bus stack name (e.g., TestBus)
- custom.leoRegister: Alternative ARN for LeoInstallFunction (cross-account)
- Stage-specific config: custom.<stage>.leoStack

---

## Development

### Running Tests
cd src && npm test

### Local Development
1. Run npm link in src/
2. In a test project: npm link serverless-leo

---

## Branch & PR Conventions

- Base branch: master
- Feature branches: feat/<task-id>-<description>
- Include Jira link in PR: https://chb.atlassian.net/browse/<KEY>
