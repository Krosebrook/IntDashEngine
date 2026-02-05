
# INT Inc Universal Dashboard Engine

A world-class enterprise dashboard engine built with React, TypeScript, Tailwind CSS, and Google Gemini AI.

## Overview

The Universal Dashboard Engine provides real-time analytics, AI-driven insights, and management tools for 13 distinct departments within INT Inc. It is designed to be a "single pane of glass" for executives and managers to monitor organizational health.

## Key Features

*   **Real-time Dashboard**: Monitor KPIs across Service Delivery, Support, and Executive departments.
*   **AI Intelligence**: Uses Google Gemini 3 Flash to analyze KPI data and generate strategic insights on demand.
*   **Interactive Charts**: 
    *   Trend analysis using Recharts.
    *   Sparklines for every KPI with deterministic historical data generation.
    *   Exportable charts (PNG/SVG) for reporting.
*   **Management Tools**:
    *   **Bulk Edit**: Select multiple KPIs to update status or targets simultaneously.
    *   **User Management**: RBAC (Role Based Access Control) administration.
*   **Export**: Full CSV export capabilities for individual or bulk data.

## Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **Visualization**: Recharts
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Utilities**: `html-to-image` for chart exports.

## Usage Guide

1.  **Authentication**: Log in using the mock authentication screen.
    *   Any email/password works for demo purposes.
    *   Social login buttons simulate provider authentication.
2.  **Navigation**: Use the sidebar to switch between Department Dashboards and Management views.
3.  **KPI Interaction**:
    *   Hover over a KPI title to see the sparkline history.
    *   Click the "History" icon (clock) to see a detailed 30-day chart.
    *   Click the "Edit" icon (pencil) to modify values (Editor/Admin only).
4.  **Bulk Actions**:
    *   Click "Bulk Edit" in the toolbar.
    *   Select multiple KPIs.
    *   Apply status changes or target multipliers.

## AI Integration

The system uses `gemini-3-flash-preview` to analyze the raw JSON data of the current department's KPIs. It generates 3 prioritized insights (Low, Medium, High, Critical) focusing on efficiency, risk, and growth.

## Developer Notes

*   **Mock Data**: The app uses a seeded random generator (`lib/utils.ts`) to ensure chart data remains consistent across renders for the same KPI ID.
*   **Permissions**: `lib/permissions.ts` handles role-based logic.
*   **Environment**: Requires `API_KEY` for Gemini features.
