import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ActivityService, activityService } from '../services/activity.service.js';
import { ActivityLog } from '../models/ActivityLog.model.js';
import { Link, ILink } from '../models/Link.model.js';
import { LinkService } from '../services/link.service.js';
import { notificationService } from '../services/notification.service.js';
import { isSafePublicIp, validateSafeHost } from '../utils/healthCheck.util.js';
import { parseCsv, generateCsv } from '../utils/csv.util.js';

describe('Productivity, Activity History & Recycle Bin Test Suite', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const testActivityService = new ActivityService();
  const linkService = new LinkService();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(activityService, 'logActivity').mockResolvedValue();
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue(null);
  });

  describe('Activity History Service', () => {
    it('should log activity records without throwing errors', async () => {
      const createSpy = vi
        .spyOn(ActivityLog, 'create')
        .mockImplementation(async () => [] as unknown as ReturnType<typeof ActivityLog.create>);

      await testActivityService.logActivity({
        userId: mockUserId,
        action: 'LINK_CREATE',
        category: 'link',
        description: 'Created short link /test-slug',
        metadata: { shortCode: 'test-slug' },
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LINK_CREATE',
          category: 'link',
          description: 'Created short link /test-slug',
        })
      );
    });

    it('should isolate history deletion and strictly preserve other collections', async () => {
      const deleteManySpy = vi.spyOn(ActivityLog, 'deleteMany').mockResolvedValueOnce({
        acknowledged: true,
        deletedCount: 15,
      } as unknown as mongoose.mongo.DeleteResult);

      // Spy on Link to verify it is NOT touched
      const linkDeleteSpy = vi.spyOn(Link, 'deleteMany');

      const result = await testActivityService.deleteAllActivityLogs(mockUserId);

      expect(result.deletedCount).toBe(15);
      expect(deleteManySpy).toHaveBeenCalledWith({
        user: expect.any(mongoose.Types.ObjectId),
      });
      // CRITICAL: Ensure Link records were NEVER deleted
      expect(linkDeleteSpy).not.toHaveBeenCalled();
    });
  });

  describe('SSRF Protection & Link Health Checker', () => {
    it('should identify private IPv4 ranges as unsafe', () => {
      expect(isSafePublicIp('127.0.0.1')).toBe(false);
      expect(isSafePublicIp('10.0.0.1')).toBe(false);
      expect(isSafePublicIp('192.168.1.1')).toBe(false);
      expect(isSafePublicIp('172.16.0.1')).toBe(false);
      expect(isSafePublicIp('169.254.169.254')).toBe(false); // Cloud metadata
      expect(isSafePublicIp('0.0.0.0')).toBe(false);
    });

    it('should identify public IP addresses as safe', () => {
      expect(isSafePublicIp('8.8.8.8')).toBe(true);
      expect(isSafePublicIp('1.1.1.1')).toBe(true);
      expect(isSafePublicIp('93.184.216.34')).toBe(true);
    });

    it('should block localhost and local domain requests immediately', async () => {
      const resLocal = await validateSafeHost('localhost');
      expect(resLocal.isSafe).toBe(false);
      expect(resLocal.error).toContain('localhost');

      const resInternal = await validateSafeHost('cluster.local');
      expect(resInternal.isSafe).toBe(false);
    });
  });

  describe('CSV Import & Export Engine', () => {
    it('should accurately parse and escape CSV payloads according to RFC 4180', () => {
      const testData = [
        { title: 'Test Link', originalUrl: 'https://example.com/one?a=1&b=2', shortCode: 'test1' },
        { title: 'Link with, comma and "quotes"', originalUrl: 'https://example.com/two', shortCode: 'test2' },
      ];

      const csvString = generateCsv(testData, [
        { key: 'title', header: 'Title' },
        { key: 'originalUrl', header: 'Destination URL' },
        { key: 'shortCode', header: 'Short Code' },
      ]);

      expect(csvString).toContain('Title,Destination URL,Short Code');
      expect(csvString).toContain('"Link with, comma and ""quotes"""');

      const parsed = parseCsv(csvString);
      expect(parsed.totalRows).toBe(2);
      expect(parsed.rows[0].data['title']).toBe('Test Link');
      expect(parsed.rows[1].data['title']).toBe('Link with, comma and "quotes"');
      expect(parsed.rows[1].data['destination url']).toBe('https://example.com/two');
    });

    it('should catch invalid URL rows during CSV import and report exact row numbers', async () => {
      const invalidCsv = `Title,Destination URL,Short Code
Good Link,https://example.com,slug1
Broken Link,not-a-valid-url,slug2
Empty Destination,,slug3`;

      // Mock createLink for the valid row
      vi.spyOn(linkService, 'createLink').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        shortCode: 'slug1',
        originalUrl: 'https://example.com',
      } as unknown as ILink);

      const result = await linkService.importLinksCsv(mockUserId, invalidCsv);

      expect(result.totalRows).toBe(3);
      expect(result.importedCount).toBe(1);
      expect(result.failedCount).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(3); // row 3 is Broken Link
      expect(result.errors[1].row).toBe(4); // row 4 is Empty Destination
    });
  });

  describe('Recycle Bin & Redirect Isolation', () => {
    it('should stop redirecting when a link is in the recycle bin (isDeleted = true)', async () => {
      vi.spyOn(Link, 'findOne').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        shortCode: 'deleted-slug',
        originalUrl: 'https://example.com',
        isDeleted: true,
        deletedAt: new Date(),
        status: 'active',
      } as unknown as ILink);

      const result = await linkService.resolveRedirect('deleted-slug', { ip: '1.2.3.4' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(404);
        expect(result.error).toContain('recycle bin');
      }
    });

    it('should allow restoring links from the recycle bin safely', async () => {
      const fakeLink = {
        _id: new mongoose.Types.ObjectId(),
        shortCode: 'restored-slug',
        originalUrl: 'https://example.com',
        owner: new mongoose.Types.ObjectId(mockUserId),
        isDeleted: true,
        deletedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      } as unknown as ILink;

      vi.spyOn(linkService, 'getLinkById').mockResolvedValueOnce(fakeLink);

      const restored = await linkService.restoreLink(fakeLink._id.toString(), mockUserId);

      expect(restored.isDeleted).toBe(false);
      expect(restored.deletedAt).toBeUndefined();
      expect(fakeLink.save).toHaveBeenCalled();
    });
  });
});
