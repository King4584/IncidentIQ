import { test, expect } from '@playwright/test';

test.describe('IncidentIQ AI - Full Investigation E2E Workflow', () => {
  test('ingests operational events, triggers AI agent, and confirms root cause', async ({ page }) => {
    // 1. Visit Dashboard
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('Incident Investigation & Evidence Platform');

    // 2. Navigate to Ingestion Page
    await page.click('text=Ingest Events');
    await expect(page.locator('h1')).toContainText('Multi-Source Operational Event Ingestion');

    // 3. Navigate to Incident Workspace
    await page.click('text=Incidents');
    await page.click('text=Investigate');
    await expect(page.locator('h1')).toContainText('Payment Gateway Gateway Connection Timeout');

    // 4. Trigger AI Investigation Agent
    await page.click('text=Trigger LangGraph AI Agent');
    await expect(page.locator('text=Success!')).toBeVisible({ timeout: 10000 });

    // 5. Verify Hypotheses Cards
    await expect(page.locator('text=Database Connection Pool Exhaustion')).toBeVisible();
    await expect(page.locator('text=Supporting Evidence')).toBeVisible();

    // 6. Navigate to Root Cause & Save
    await page.click('text=Root Cause & Mitigations');
    await page.click('text=Lockdown & Save Root Cause');
    await expect(page.locator('text=Confirmed Root Cause saved successfully')).toBeVisible();
  });
});
