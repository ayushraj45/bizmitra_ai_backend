# BizMitra AI Backend – NodeJS Scheduling & Meta Webhooks

BizMitra AI Backend is a NodeJS service that powers BizMitra’s WhatsApp‑based and website-based(widget) AI assistant, handling Meta webhooks, AI agent orchestration, scheduling, and website configuration from a production‑ready, containerized backend, working smoothly within a Kubernetes Cluster.

***

## Core Responsibilities

- **Meta webhook handling** – Receives and processes Meta (WhatsApp) webhook events for messages, status updates, and delivery receipts.
- **AI orchestration layer** – Connects BizMitra to ResponsesAPI / AgentsSDK, routing user messages through AI agents and returning structured responses to clients.
- **Scheduling engine** – Manages time‑based jobs for follow‑ups, reminders, and other WhatsApp touchpoints.
- **Website & workspace configuration** – Fetches basic HTML to create instructions, stores and serves configuration for websites, workspaces, and customer‑specific settings used by the dashboard and landing pages.

This project sits at the center of BizMitra’s messaging and automation stack.

***

## Tech Stack

- **Runtime**: NodeJS
- **Architecture**: Express‑style layered design with controllers, services, models, and middleware.
- **Database**: Postgres / Configured via `db.js` with a dedicated connection layer for persistence.
- **Infrastructure**:
  - `docker-compose.yml` for containerized local and production‑like environments.
- **k8s**: Kubernetes cluster detailed in kind-config.yaml, /k8s file configure the postgres and backend app.
This demonstrates practical experience building real NodeJS backends that are deployable via containers and clusters.

***

## Architecture and Folder Structure

The `src` directory follows a clean, scalable structure designed for growth and readability.

- `src/app.js` – Application bootstrap, middleware registration, and route wiring.
- `src/db.js` – Database connection configuration and initialization.
- `src/controllers/` – HTTP and webhook controllers containing request/response handling logic.
- `src/routes/` – Route definitions mapping URLs to controllers.
- `src/services/` – Business logic for scheduling, AI calls, Meta/WhatsApp integrations, and configuration handling.
- `src/models/` – Data models and abstractions for entities like workspaces, configurations, and scheduled jobs.
- `src/middleware/` – Cross‑cutting concerns such as auth, validation, logging, and error handling.
- `src/utils/` – Shared helpers for time, formatting, logging, and other utilities.
- `src/ai/` – Integration with ResponsesAPI + AgentsSDK and other AI‑related logic.
- `src/config/` – Environment‑specific configuration, including secrets loaded from env variables or external files.

This layout keeps concerns separated and makes it easy to extend the system with new features or integrations.

***

## Meta Webhooks and WhatsApp Flow

A key responsibility of this backend is managing WhatsApp traffic through Meta’s webhook infrastructure.

- **Webhook endpoints**  
  - Dedicated routes and controllers for incoming Meta webhook events.
  - Verification logic and signature checking handled in middleware/config.

- **Message routing**  
  - Incoming messages are validated, normalized, and passed to the AI orchestration layer.
  - Outgoing messages are triggered from services, respecting Meta’s API expectations and rate limits.

This shows the ability to work with real‑world third‑party APIs and event‑driven architectures.

***

## AI Orchestration (ResponsesAPI + AgentsSDK)

The backend acts as the “brain router” between WhatsApp users and BizMitra’s AI agents.

- **AI integration layer (src/ai)**  
  - Encapsulates calls to ResponsesAPI / AgentsSDK so business logic is not tightly coupled to a single provider.
  - Supports multiple agent configurations and contexts per workspace or use case.

- **Conversation logic**  
  - Services determine which agent or flow to use based on workspace configuration and message metadata.
  - Responses are formatted and sent back through WhatsApp with appropriate prompts and templates.

This demonstrates experience in designing extensible AI integration layers rather than hard‑coded API calls.

***

## Scheduling Engine and Automation

BizMitra AI Backend includes a scheduling engine to keep conversations and workflows moving.

- **Scheduled appointments**  
  - Schedules and reschedules appointments/events with potential cusotmers on business's Google Calendar 

- **Configuration‑driven behavior**  
  - Schedules and triggers can be tied to workspace configuration, making automation behavior customizable per client.

This highlights the ability to implement and manage background jobs, a core requirement in real SaaS systems.

***

## Configuration and Multi‑Workspace Support

The backend is designed to serve multiple workspaces/clients with different needs.

- **Configuration models**  
  - Models and services under `models/` and `services/` handle workspace‑level settings such as AI agent configuration, webhooks, and message templates.

- **Website integration**  
  - The same backend supports website‑level configuration used by the landing page and dashboard, so changes are centralized.

This demonstrates comfort with multi‑tenant style patterns and configuration centralization.

***

## Containerization and CI/CD

The project includes infrastructure code to support reliable deployments.

- **Docker support**  
  - `docker-compose.yml` defines services, networks, and dependencies for running the backend in containers.

- **CI/CD setup**  
  - GitHub configuration under `.github` (workflows) is prepared to run builds/tests and automate deployments.

These pieces show a full‑stack understanding that goes beyond just writing API endpoints.

***

## Getting Started

1. **Clone the repository**  
   ```bash
   git clone https://github.com/ayushraj45/bizmitra_ai_backend.git
   cd bizmitra_ai_backend
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Set environment variables**  
   - Create a `.env` file or use your environment to provide:
     - Database connection strings  
     - Meta / WhatsApp credentials  
     - ResponsesAPI / AgentsSDK keys  
     - Any other secrets referenced in `src/config`  


4. **Run locally**  
   ```bash
   npm run dev
   ```
   or with Docker:
   ```bash
   docker-compose up --build
   ```
   The API will be available on the port specified in your configuration (typically `http://localhost:3000` or similar).

***

## Developer Highlights

This backend showcases:

- Ability to design a production‑grade NodeJS backend with a clear architecture and container‑friendly setup.
- Experience integrating Meta webhooks, WhatsApp flows, AI providers (ResponsesAPI, AgentsSDK), and a scheduling engine into one cohesive system.
- Practical understanding of multi‑workspace configuration, automation, and deployable infrastructure suitable for a real SaaS product.
