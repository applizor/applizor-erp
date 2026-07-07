import prisma from '../prisma/client';

export interface SecurityCheckResult {
  isSecure: boolean;
  reason?: string;
}

export class AttendanceSecurityService {
  /**
   * Helper to convert degrees to radians
   */
  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculates distance between two coordinates in meters using the Haversine formula
   */
  public static getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 * 1000; // Earth radius in meters
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Evaluates if checking in at the current location is physically possible
   * based on the last check-in/out location and timestamp.
   */
  public static async checkImpossibleTravel(
    employeeId: string,
    currentLat: number,
    currentLon: number
  ): Promise<SecurityCheckResult> {
    const lastLog = await prisma.attendance.findFirst({
      where: { employeeId },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastLog || !lastLog.location) {
      return { isSecure: true };
    }

    const [lastLatRaw, lastLonRaw] = lastLog.location.split(',');
    const lastLat = parseFloat(lastLatRaw);
    const lastLon = parseFloat(lastLonRaw);

    if (isNaN(lastLat) || isNaN(lastLon)) {
      return { isSecure: true };
    }

    const distanceMeters = this.getDistanceInMeters(lastLat, lastLon, currentLat, currentLon);
    const distanceKm = distanceMeters / 1000;

    // Time difference in hours
    const timeDiffMs = Date.now() - lastLog.updatedAt.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    // Skip travel checks if time difference is extremely long (e.g., > 24 hours)
    if (timeDiffHours > 24) {
      return { isSecure: true };
    }

    // Minimum time threshold to avoid division noise on close punches
    if (timeDiffHours < 0.02) { // approx 1 minute
      // If distance is large (e.g. > 1km) in less than a minute, it's impossible!
      if (distanceKm > 1) {
        return {
          isSecure: false,
          reason: `Impossible Travel: Location changed by ${distanceKm.toFixed(1)} km in less than a minute.`
        };
      }
      return { isSecure: true };
    }

    const velocityKmh = distanceKm / timeDiffHours;

    // Enterprise limit: 180 km/h (covers fast commuter trains/cars, flags flight-like/VPN teleports)
    if (velocityKmh > 180) {
      return {
        isSecure: false,
        reason: `Impossible Travel: Detected required travel speed of ${velocityKmh.toFixed(0)} km/h over ${distanceKm.toFixed(1)} km.`
      };
    }

    return { isSecure: true };
  }

  /**
   * Performs geolocation check on the client IP address and ensures it aligns
   * with the reported GPS coordinates.
   */
  public static async verifyIpLocationProximity(
    ip: string,
    gpsLat: number,
    gpsLon: number
  ): Promise<SecurityCheckResult> {
    // Skip local address ranges
    if (
      !ip ||
      ip.includes('127.0.0.1') ||
      ip.includes('::1') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.16.')
    ) {
      return { isSecure: true };
    }

    try {
      // Query a free IP geolocation service with a strict 1500ms timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(`http://ip-api.com/json/${ip}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return { isSecure: true }; // Fail open if geolocation API is down
      }

      const data: any = await response.json();
      if (data.status !== 'success' || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
        return { isSecure: true };
      }

      const distanceMeters = this.getDistanceInMeters(data.lat, data.lon, gpsLat, gpsLon);
      const distanceKm = distanceMeters / 1000;

      // VPN / GPS discrepancy limit: 800 km (allows for cell towers, routing hubs, but flags country hops)
      if (distanceKm > 800) {
        return {
          isSecure: false,
          reason: `IP Location mismatch: IP resolves to ${data.city || 'another city'} (${distanceKm.toFixed(0)} km away). Possible VPN/Mock location.`
        };
      }
    } catch (err) {
      // Fail open on fetch errors or aborts to prevent blocking legitimate employees
      console.warn(`[Security] IP location verification skipped:`, err);
    }

    return { isSecure: true };
  }

  /**
   * Evaluates mock provider flags sent from the client or abnormal GPS accuracy metadata.
   */
  public static verifyClientMetadata(
    isMocked?: boolean,
    accuracy?: number
  ): SecurityCheckResult {
    if (isMocked === true) {
      return {
        isSecure: false,
        reason: 'Mock Location provider detected by client-side device checks.'
      };
    }

    // Suspiciously exact accuracy (e.g. exactly 0 or exactly 1.0000) is a common signature of software mock providers.
    if (accuracy === 0) {
      return {
        isSecure: false,
        reason: 'Suspicious GPS telemetry accuracy: exact 0 telemetry indicates simulation/spoof tool.'
      };
    }

    // Excessively poor accuracy indicates unusable data
    if (accuracy && accuracy > 1500) {
      return {
        isSecure: false,
        reason: `Insufficient GPS accuracy (${accuracy.toFixed(0)}m). Must be under 1500m.`
      };
    }

    return { isSecure: true };
  }
}
