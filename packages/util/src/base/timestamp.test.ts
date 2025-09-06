import { describe, expect, it } from "vitest";
import { TIME } from "./timestamp";

describe("TIME utilities", () => {
  describe("SECONDS", () => {
    it("should convert to milliseconds", () => {
      expect(TIME.SECONDS()).toBe(1000);
      expect(TIME.SECONDS(5)).toBe(5000);
      expect(TIME.SECONDS(0.5)).toBe(500);
    });

    it("should convert from milliseconds", () => {
      expect(TIME.SECONDS.FROM(1000)).toBe(1);
      expect(TIME.SECONDS.FROM(5000)).toBe(5);
      expect(TIME.SECONDS.FROM(500)).toBe(0.5);
    });
  });

  describe("MINUTES", () => {
    it("should convert to milliseconds", () => {
      expect(TIME.MINUTES()).toBe(60000); // 60 * 1000
      expect(TIME.MINUTES(2)).toBe(120000); // 2 * 60 * 1000
      expect(TIME.MINUTES(0.5)).toBe(30000); // 0.5 * 60 * 1000
    });

    it("should convert from milliseconds", () => {
      expect(TIME.MINUTES.FROM(60000)).toBe(1);
      expect(TIME.MINUTES.FROM(120000)).toBe(2);
      expect(TIME.MINUTES.FROM(30000)).toBe(0.5);
    });
  });

  describe("HOURS", () => {
    it("should convert to milliseconds", () => {
      expect(TIME.HOURS()).toBe(3600000); // 60 * 60 * 1000
      expect(TIME.HOURS(2)).toBe(7200000); // 2 * 60 * 60 * 1000
      expect(TIME.HOURS(0.5)).toBe(1800000); // 0.5 * 60 * 60 * 1000
    });

    it("should convert from milliseconds", () => {
      expect(TIME.HOURS.FROM(3600000)).toBe(1);
      expect(TIME.HOURS.FROM(7200000)).toBe(2);
      expect(TIME.HOURS.FROM(1800000)).toBe(0.5);
    });
  });

  describe("DAYS", () => {
    it("should convert to milliseconds", () => {
      expect(TIME.DAYS()).toBe(86400000); // 24 * 60 * 60 * 1000
      expect(TIME.DAYS(2)).toBe(172800000); // 2 * 24 * 60 * 60 * 1000
      expect(TIME.DAYS(0.5)).toBe(43200000); // 0.5 * 24 * 60 * 60 * 1000
    });

    it("should convert from milliseconds", () => {
      expect(TIME.DAYS.FROM(86400000)).toBe(1);
      expect(TIME.DAYS.FROM(172800000)).toBe(2);
      expect(TIME.DAYS.FROM(43200000)).toBe(0.5);
    });
  });

  describe("WEEKS", () => {
    it("should convert to milliseconds", () => {
      expect(TIME.WEEKS()).toBe(604800000); // 7 * 24 * 60 * 60 * 1000
      expect(TIME.WEEKS(2)).toBe(1209600000); // 2 * 7 * 24 * 60 * 60 * 1000
      expect(TIME.WEEKS(0.5)).toBe(302400000); // 0.5 * 7 * 24 * 60 * 60 * 1000
    });

    it("should convert from milliseconds", () => {
      expect(TIME.WEEKS.FROM(604800000)).toBe(1);
      expect(TIME.WEEKS.FROM(1209600000)).toBe(2);
      expect(TIME.WEEKS.FROM(302400000)).toBe(0.5);
    });
  });

  describe("YEARS", () => {
    it("should convert to milliseconds", () => {
      expect(TIME.YEARS()).toBe(31536000000); // 365 * 24 * 60 * 60 * 1000
      expect(TIME.YEARS(2)).toBe(63072000000); // 2 * 365 * 24 * 60 * 60 * 1000
      expect(TIME.YEARS(0.5)).toBe(15768000000); // 0.5 * 365 * 24 * 60 * 60 * 1000
    });

    it("should convert from milliseconds", () => {
      expect(TIME.YEARS.FROM(31536000000)).toBe(1);
      expect(TIME.YEARS.FROM(63072000000)).toBe(2);
      expect(TIME.YEARS.FROM(15768000000)).toBe(0.5);
    });
  });

  describe("time unit conversions", () => {
    it("should correctly convert between different units", () => {
      // 1 minute = 60 seconds
      expect(TIME.MINUTES.FROM(TIME.SECONDS(60))).toBe(1);

      // 1 hour = 60 minutes
      expect(TIME.HOURS.FROM(TIME.MINUTES(60))).toBe(1);

      // 1 day = 24 hours
      expect(TIME.DAYS.FROM(TIME.HOURS(24))).toBe(1);

      // 1 week = 7 days
      expect(TIME.WEEKS.FROM(TIME.DAYS(7))).toBe(1);

      // 1 year = 365 days
      expect(TIME.YEARS.FROM(TIME.DAYS(365))).toBe(1);
    });

    it("should handle compound time calculations", () => {
      // 2 hours + 30 minutes in milliseconds
      const twoHoursThirtyMinutes = TIME.HOURS(2) + TIME.MINUTES(30);
      expect(twoHoursThirtyMinutes).toBe(9000000); // 2.5 hours * 3600000

      // Convert back to hours
      expect(TIME.HOURS.FROM(twoHoursThirtyMinutes)).toBe(2.5);
    });

    it("should handle real-world timing scenarios", () => {
      // A typical work day: 8 hours
      const workDay = TIME.HOURS(8);
      expect(workDay).toBe(28800000);

      // A lunch break: 1 hour
      const lunchBreak = TIME.HOURS(1);
      expect(lunchBreak).toBe(3600000);

      // Working hours without lunch
      const actualWork = workDay - lunchBreak;
      expect(TIME.HOURS.FROM(actualWork)).toBe(7);
    });
  });

  describe("precision and edge cases", () => {
    it("should handle zero values", () => {
      expect(TIME.SECONDS(0)).toBe(0);
      expect(TIME.MINUTES(0)).toBe(0);
      expect(TIME.HOURS(0)).toBe(0);
      expect(TIME.DAYS(0)).toBe(0);
      expect(TIME.WEEKS(0)).toBe(0);
      expect(TIME.YEARS(0)).toBe(0);
    });

    it("should handle negative values", () => {
      expect(TIME.SECONDS(-1)).toBe(-1000);
      expect(TIME.MINUTES(-1)).toBe(-60000);
      expect(TIME.HOURS(-1)).toBe(-3600000);
      expect(TIME.DAYS(-1)).toBe(-86400000);
      expect(TIME.WEEKS(-1)).toBe(-604800000);
      expect(TIME.YEARS(-1)).toBe(-31536000000);
    });

    it("should handle very small values", () => {
      expect(TIME.SECONDS(0.001)).toBe(1);
      expect(TIME.MINUTES(0.001)).toBe(60);
      expect(TIME.HOURS(0.001)).toBe(3600);
    });

    it("should handle very large values", () => {
      const largeValue = 1000000;
      expect(TIME.YEARS(largeValue)).toBe(largeValue * 31536000000);
      expect(TIME.YEARS.FROM(TIME.YEARS(largeValue))).toBe(largeValue);
    });
  });

  describe("practical usage examples", () => {
    it("should calculate timeout durations", () => {
      // API timeout: 30 seconds
      const apiTimeout = TIME.SECONDS(30);
      expect(apiTimeout).toBe(30000);

      // File upload timeout: 5 minutes
      const uploadTimeout = TIME.MINUTES(5);
      expect(uploadTimeout).toBe(300000);

      // Session timeout: 24 hours
      const sessionTimeout = TIME.HOURS(24);
      expect(sessionTimeout).toBe(86400000);
    });

    it("should calculate cache expiration times", () => {
      // Short cache: 5 minutes
      const shortCache = TIME.MINUTES(5);
      expect(shortCache).toBe(300000);

      // Medium cache: 1 hour
      const mediumCache = TIME.HOURS(1);
      expect(mediumCache).toBe(3600000);

      // Long cache: 1 day
      const longCache = TIME.DAYS(1);
      expect(longCache).toBe(86400000);
    });

    it("should calculate polling intervals", () => {
      // Real-time updates: every 5 seconds
      const realTime = TIME.SECONDS(5);
      expect(realTime).toBe(5000);

      // Regular updates: every 30 seconds
      const regular = TIME.SECONDS(30);
      expect(regular).toBe(30000);

      // Background sync: every 5 minutes
      const background = TIME.MINUTES(5);
      expect(background).toBe(300000);
    });
  });
});
