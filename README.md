# 🚀 Embed Club | P.A. College of Engineering

<div align="center">
  <img src="public/embedClubBanner-Dark.svg" alt="Embed Club Logo" width="600" />
  <p align="center">
    <strong>A student-led self-learning club dedicated to Embedded Systems and IoT at PACE</strong>
  </p>

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Payload CMS](https://img.shields.io/badge/Payload-3.0-blue?style=for-the-badge&logo=payloadcms)](https://payloadcms.com/)
  [![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-green?style=for-the-badge&logo=postgresql)](https://neon.tech/)
  [![Supabase](https://img.shields.io/badge/Supabase-S3_Storage-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
</div>

## 📖 About Us
Welcome to the IoT and Embedded Systems Club at **P.A. College of Engineering**. We are a group of passionate students and tech enthusiasts who share a common interest in embedded systems, IoT, and computer science. Our club provides a platform for students to explore, experiment, and create with technology through events, workshops, and projects.

### 👥 Foundational Team & Alumni
Embed Club emerged from the collective vision of its founding members: **Habeeb Ur Rehman**, **Nishant Narayanan**, and **Mohammed Saifuddin**. Our alumni play a vital role, leveraging industry experience to train current students in advanced technologies through workshops and mentorship.

Embedded system education is a challenge because it sits at the intersection of many disciplines. Embed Club is planned and managed by the students themselves, ensuring we stay close to industry requirements while learning consciously and actively.

### 🏛️ History
Embed Club was inaugurated on **14th November 2018 at PACE**. The club was founded with these core objectives:
- **Infrastructure**: Creating a community with infrastructure to help technical minds.
- **Knowledge Transfer**: Connecting experienced mentors and newbies to transfer knowledge.
- **Innovation**: Connecting like-minded technocrats to generate ideas, products, and technologies.
- **Open Lab**: Creating an Open Lab with the latest hardware and tools through community contributions.

---

## 💎 Project Overview

**Embed Club** is the IoT and Embedded Systems Club at **P.A. College of Engineering (PACE)**. We are a community of student tech enthusiasts dedicated to self-learning, collaboration, and hands-on innovation in the fields of embedded systems and computer science.

### 🎯 Mission
We are dedicated to advancing knowledge and expertise in embedded systems and IoT. Our mission is to foster a community of passionate learners and innovators who collaborate, create, and make a positive impact through technology.

### 🔭 Vision
Our vision is to be a leading hub for innovation in embedded systems and IoT. We aim to inspire and educate the next generation of engineers and problem solvers who will shape the future of technology.

### 🌐 Get Connected!
Embed Club connects over **100+ members** who share a passion for embedded systems and innovation. Collaborate on groundbreaking projects, host tech events, and network with professionals in fields like Embedded AI, Real-time Systems, and IoT. Join us and be a part of something big!

## Project Structure

```text
/public       - Static assets (fonts, brand logos, etc.)
/src
  /app        - Next.js 15 App Router (Frontend & Payload Admin)
  /components - Reusable React components & Layouts
  /payload    - Payload CMS Config & Collections
  /lib        - Shared utilities and type-safe helpers
  /hooks      - Custom React hooks
```

### 🌟 High-Fidelity Features

- **Intro Visual Identity**: A specialized **Shared Element Transition** (Logo Glide) that persists across page loads for a premium "App-like" feel.
- **Automated Media Engine**: Integrated **Sharp-powered WebP compression** and responsive image generation hosted on Supabase S3.
- **Relational Directory**: Sophisticated member profiles with hierarchical roles, categories, and achievement tracking.
- **Resource Hub**: A curated repository of tools, tutorials, and simulators with advanced tagging and search capabilities.
- **Event Orchestration**: Full lifecycle management for workshops, meetings, and club activities.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router) | Core application routing and SSR/ISR |
| **Backend/CMS** | Payload CMS 3.0 | Headless content management & headless API |
| **Database** | Neon (PostgreSQL) | Serverless relational database hosting |
| **Storage** | Supabase (S3 Compatible) | Persistent cloud storage for media & member photos |
| **Motion** | Framer Motion & GSAP | High-fidelity UI animations and transitions |
| **Styling** | Vanilla CSS + Tailwind | Custom design tokens and modern utility layout |

## Deployment

This project is optimized for deployment on Vercel or similar platforms. 

### Build Process
The build command in `package.json` includes critical steps for Payload 3.x:
1.  **Database Migrations**: `pnpm run payload migrate` runs automatically to sync the database schema.
2.  **Import Map Generation**: `pnpm run generate:importmap` creates the component mappings required for the Admin Panel.
3.  **Next.js Build**: Standard `next build` for the application.

### Environment Variables
Ensure the following are set in production:
- `DATABASE_URL`: Neon/Postgres connection string.
- `PAYLOAD_SECRET`: A secure random string.
## Contributing

1.  **Create a Branch**: `git checkout -b feature/your-feature-name`
2.  **Make Changes**: Follow the coding standards (Biome for linting/formatting).
3.  **Submit a PR**: Detailed description of changes.

---

## 🚀 Development Quick-Start

### 1. Prerequisites
- **Node.js**: >= 20.9.0
- **pnpm**: Latest version (preferred)

### 2. Environment Configuration
Clone the repository and create a `.env` file based on the enterprise configuration:

```bash
# Database & Authentication
DATABASE_URL=postgresql://...
PAYLOAD_SECRET=your_secret_key

# Supabase S3 Storage (Required for Media)
S3_ENDPOINT=https://your-proj.supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=your_id
S3_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=media
S3_REGION=ap-southeast-2
```

### 3. Installation & Boot
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

---

## 📤 Production Deployment

This project is optimized for **Vercel** and **Neon**.

1.  **Database Migration**: Ensure your Neon project is configured with the correct schema. For fresh starts, utilize the `CASCADE` drop to allow Payload to recreate the optimized schema.
2.  **Storage Access**: Ensure the Supabase bucket is set to **Public** to allow the frontend to serve WebP assets.
3.  **Deployment**: Pushing to the `main` branch triggers an automated CI/CD pipeline.

---

## 🛡️ Engineering Standards

- **Asset Optimization**: All images are automatically transcoded to WebP with an 80% quality threshold to minimize LCP (Largest Contentful Paint).
- **Responsive Systems**: Grid-based layouts ensure parity across 4K displays and mobile palmtop devices.
- **Persistence**: Intro animations utilize specialized state management to prevent visual flickering during navigation.

---

<p align="center">
  Built with ❤️ by the Embed Club Engineering Team.
</p>
