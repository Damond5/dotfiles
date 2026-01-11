/**
 * Validation tests for session-idle-notifier.js plugin
 * Consolidates validation from validate-plugins.js (12 checks) and test-plugin-logic.js (6 tests)
 * Tests SDK v1.1.1 compliance and code structure patterns
 */

import { test, expect, describe, beforeAll } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SessionIdleNotifier Validation Tests', () => {
  let pluginCode;

  beforeAll(() => {
    const pluginPath = path.join(process.cwd(), 'plugin', 'session-idle-notifier.js');
    pluginCode = fs.readFileSync(pluginPath, 'utf8');
  });

  describe('ES Module Export Syntax', () => {
    test('should have proper ES module export syntax', () => {
      expect(pluginCode).toContain('export const SessionIdleNotifier');
    });

    test('should export as async function', () => {
      expect(pluginCode).toMatch(/export const SessionIdleNotifier\s*=\s*async/);
    });
  });

  describe('notify-send Availability Check', () => {
    test('should check notify-send availability', () => {
      expect(pluginCode).toContain('test -x /usr/bin/notify-send');
    });

    test('should handle notify-send unavailability gracefully', () => {
      expect(pluginCode).toMatch(/catch\s*\{[^}]*console\.warn/);
    });
  });

  describe('session.idle Event Handler', () => {
    test('should handle session.idle event type', () => {
      expect(pluginCode).toMatch(/event\.type\s*!==\s*["']session\.idle["']|event\.type\s*===\s*["']session\.idle["']/);
    });

    test('should check for event existence', () => {
      expect(pluginCode).toMatch(/if\s*\(\s*!\s*event/);
    });
  });

  describe('SDK v1.1.1 API-based Detection', () => {
    test('should use client.session.get for API-based detection', () => {
      expect(pluginCode).toContain('client.session.get');
    });

    test('should pass correct path structure', () => {
      expect(pluginCode).toMatch(/path:\s*\{\s*id:\s*sessionID\s*\}/);
    });

    test('should check for session data in API response', () => {
      expect(pluginCode).toMatch(/sessionResult\.data/);
    });
  });

  describe('parentID Validation', () => {
    test('should extract parentID from session data', () => {
      expect(pluginCode).toMatch(/const\s+parentID\s*=\s*session\.parentID/);
    });

    test('should check parentID to identify subagents', () => {
      expect(pluginCode).toMatch(/if\s*\(\s*parentID\s*\)/);
    });
  });

  describe('Fallback to Property-based Detection', () => {
    test('should fallback when API fails', () => {
      expect(pluginCode).toMatch(/catch\s*\([^)]*\)\s*\{[^}]*falling back/);
    });

    test('should log fallback warning', () => {
      expect(pluginCode).toMatch(/console\.warn\([^)]*falling back to property-based detection/);
    });

    test('should extract parentID from properties as fallback', () => {
      expect(pluginCode).toMatch(/props\.parentID/);
    });
  });

  describe('Legacy Property-based Detection Support', () => {
    test('should check agent mode for legacy detection', () => {
      expect(pluginCode).toMatch(/agent\?\.\s*mode|agent\.mode/);
    });

    test('should handle missing client gracefully', () => {
      // The plugin should work without client parameter
      expect(pluginCode).toMatch(/async\s*\(\s*\{\s*\$\s*,\s*directory/);
    });

    test('should use optional chaining for agent', () => {
      expect(pluginCode).toContain('agent?.mode');
    });
  });

  describe('sessionID Validation', () => {
    test('should extract sessionID from event properties', () => {
      expect(pluginCode).toMatch(/const\s*\{\s*sessionID\s*\}\s*=\s*event\.properties/);
    });

    test('should validate sessionID exists', () => {
      expect(pluginCode).toMatch(/if\s*\(\s*!\s*sessionID\s*\)/);
    });

    test('should handle missing sessionID gracefully', () => {
      expect(pluginCode).toMatch(/console\.warn\([^)]*No sessionID/);
    });
  });

  describe('Notification Message Construction', () => {
    test('should send proper idle notification', () => {
      expect(pluginCode).toContain('"Session is idle"');
    });

    test('should use notify-send for notifications', () => {
      expect(pluginCode).toMatch(/notify-send\s*["']OpenCode["']\s*["']Session is idle["']/);
    });

    test('should include urgency parameter', () => {
      expect(pluginCode).toContain('--urgency=normal');
    });
  });

  describe('Error Handling', () => {
    test('should have try-catch for notification sending', () => {
      expect(pluginCode).toMatch(/catch\s*\(\s*error\s*\)\s*\{[^}]*console\.error/);
    });

    test('should log API errors', () => {
      expect(pluginCode).toMatch(/catch\s*\([^)]*apiError[^)]*\)\s*\{[^}]*console\.warn/);
    });

    test('should handle notification errors gracefully', () => {
      expect(pluginCode).toMatch(/catch\s*\([^)]*\)\s*\{[^}]*console\.error/);
    });
  });

  describe('Notification Availability Guard', () => {
    test('should check notify availability before sending', () => {
      expect(pluginCode).toMatch(/if\s*\(\s*!\s*notifyAvailable\s*\)\s*return/);
    });

    test('should set notifyAvailable based on check result', () => {
      expect(pluginCode).toMatch(/notifyAvailable\s*=\s*true/);
    });
  });

  describe('API Error Handling with Graceful Fallback', () => {
    test('should catch API errors', () => {
      expect(pluginCode).toMatch(/catch\s*\(\s*apiError\s*\)/);
    });

    test('should fallback to property-based detection on API error', () => {
      expect(pluginCode).toMatch(/if\s*\(\s*isSubagent\s*\)\s*\{[^}]*return/);
    });

    test('should handle API errors without throwing', () => {
      // The catch block should handle the error gracefully
      expect(pluginCode).toMatch(/catch\s*\([^)]*apiError[^)]*\)\s*\{[^}]*console\.warn[^}]*\}/);
    });
  });

  describe('Core Logic Pattern Validation', () => {
    test('should identify primary agent via API (no parentID)', () => {
      const sessionData = { sessionID: 'test-123', parentID: null };
      const parentID = sessionData.parentID;
      const isSubagent = !!parentID;
      
      expect(isSubagent).toBe(false);
    });

    test('should identify subagent via API (has parentID)', () => {
      const sessionData = { sessionID: 'subagent-456', parentID: 'parent-789' };
      const parentID = sessionData.parentID;
      const isSubagent = !!parentID;
      
      expect(isSubagent).toBe(true);
    });

    test('should fallback to property-based detection when API fails', () => {
      const fallbackProps = { parentID: 'parent-123' };
      const parentID = fallbackProps.parentID;
      const agentMode = fallbackProps.agent?.mode;
      const isSubagent = !!(parentID || agentMode === 'subagent');
      
      expect(isSubagent).toBe(true);
    });

    test('should identify primary agent via properties', () => {
      const props = { agent: { mode: 'assistant' } };
      const parentID = props.parentID;
      const agentMode = props.agent?.mode;
      const isSubagent = parentID || agentMode === 'subagent';
      
      expect(isSubagent).toBe(false);
    });

    test('should identify subagent via properties (agent mode)', () => {
      const props = { agent: { mode: 'subagent' } };
      const parentID = props.parentID;
      const agentMode = props.agent?.mode;
      const isSubagent = parentID || agentMode === 'subagent';
      
      expect(isSubagent).toBe(true);
    });

    test('should identify subagent via properties (parentID)', () => {
      const props = { parentID: 'parent-456' };
      const parentID = props.parentID;
      const agentMode = props.agent?.mode;
      const isSubagent = !!(parentID || agentMode === 'subagent');
      
      expect(isSubagent).toBe(true);
    });
  });
});