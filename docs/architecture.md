# BreakIfy Architecture & Foundation Documentation

## Overview
BreakIfy is a production-oriented URL shortening and link management SaaS platform.

- **Brand:** BreakIfy
- **Domain:** `breakify.site`
- **Tagline:** Shorten. Track. Share.

## High-Level Topology

The project is organized as a modular monolith split into two decoupled sub-applications:

1. **`client/` (Frontend):**
   - **Engine:** Vite + React + TypeScript
   - **Styling:** Tailwind CSS with a dark-first design system and light mode support
   - **Icons:** Lucide React
   - **Architecture:** Component-driven, responsive UI consuming backend REST endpoints

2. **`server/` (Backend):**
   - **Runtime:** Node.js + Express + TypeScript
   - **Database:** MongoDB via Mongoose ORM
   - **Security:** Helmet, CORS, centralized error handling, and structured logging
   - **Architecture:** Layered REST API (Routes -> Controllers -> Services -> Models)

3. **`assets/` (Shared Brand Assets):**
   - Stores raw brand assets such as `assets/images/BreakIfy Logo.png` untouched.

## Development Ports & Network Setup
- Frontend Dev Server: `http://localhost:5173`
- Backend API Server: `http://localhost:5000`
- API Health Check Route: `http://localhost:5000/api/v1/health`

