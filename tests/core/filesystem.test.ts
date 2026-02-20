import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { ensureDir, writeFile, fileExists, getProjectRoot, getSupercraftDir } from '../../src/core/filesystem.js';

const TEST_DIR = path.join(os.tmpdir(), 'supercraft-fs-test-' + Date.now());

describe('filesystem', () => {
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('ensureDir', () => {
    it('should create directory if not exists', () => {
      const testDir = path.join(TEST_DIR, 'ensure-test');
      expect(fs.existsSync(testDir)).toBe(false);
      ensureDir(testDir);
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should not fail if directory exists', () => {
      ensureDir(TEST_DIR);
      expect(fs.existsSync(TEST_DIR)).toBe(true);
    });

    it('should create nested directories', () => {
      const nestedDir = path.join(TEST_DIR, 'a', 'b', 'c');
      ensureDir(nestedDir);
      expect(fs.existsSync(nestedDir)).toBe(true);
    });
  });

  describe('writeFile', () => {
    it('should write file to path', () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      writeFile(filePath, 'hello world');
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello world');
    });

    it('should create parent directories automatically', () => {
      const filePath = path.join(TEST_DIR, 'subdir', 'test.txt');
      writeFile(filePath, 'content');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should overwrite existing file', () => {
      const filePath = path.join(TEST_DIR, 'overwrite.txt');
      writeFile(filePath, 'original');
      writeFile(filePath, 'updated');
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('updated');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      const filePath = path.join(TEST_DIR, 'exists.txt');
      fs.writeFileSync(filePath, 'content');
      expect(fileExists(filePath)).toBe(true);
    });

    it('should return false for non-existing file', () => {
      const filePath = path.join(TEST_DIR, 'notexists.txt');
      expect(fileExists(filePath)).toBe(false);
    });

    it('should return false for directory', () => {
      expect(fileExists(TEST_DIR)).toBe(false);
    });
  });

  describe('getProjectRoot', () => {
    it('should return current working directory', () => {
      const root = getProjectRoot();
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
    });
  });

  describe('getSupercraftDir', () => {
    it('should return .supercraft in project root', () => {
      const supercraftDir = getSupercraftDir();
      expect(supercraftDir.endsWith('.supercraft')).toBe(true);
    });
  });
});
