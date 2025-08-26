import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface CacheOptions {
  maxAge?: number;
  private?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  etag?: boolean;
  lastModified?: boolean;
}

export const CACHE_DURATIONS = {
  STATIC: 31536000,
  API_DATA: 300,    
  USER_DATA: 60,    
  REALTIME: 0,      
} as const;

//Generate ETag for response data

function generateETag(data: any): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

//Set cache headers middleware

export function setCacheHeaders(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      maxAge = CACHE_DURATIONS.API_DATA,
      private: isPrivate = false,
      noStore = false,
      mustRevalidate = true,
      etag = true,
      lastModified = true
    } = options;

    const originalJson = res.json;

    res.json = function(data: any) {
      if (lastModified) {
        res.set('Last-Modified', new Date().toUTCString());
      }

      if (etag && data) {
        const etagValue = generateETag(data);
        res.set('ETag', etagValue);

        const ifNoneMatch = req.get('If-None-Match');
        if (ifNoneMatch === etagValue) {
          return res.status(304).end();
        }
      }

      if (lastModified) {
        const ifModifiedSince = req.get('If-Modified-Since');
        const lastModifiedDate = res.get('Last-Modified');
        
        if (ifModifiedSince && lastModifiedDate) {
          const ifModifiedSinceDate = new Date(ifModifiedSince);
          const lastModDate = new Date(lastModifiedDate);
          
          if (ifModifiedSinceDate >= lastModDate) {
            return res.status(304).end();
          }
        }
      }

      let cacheControl = '';
      
      if (noStore) {
        cacheControl = 'no-store';
      } else {
        const privacy = isPrivate ? 'private' : 'public';
        const revalidate = mustRevalidate ? ', must-revalidate' : '';
        cacheControl = `${privacy}, max-age=${maxAge}${revalidate}`;
      }
      
      res.set('Cache-Control', cacheControl);

      res.set('X-Offline-Support', 'true');
      res.set('X-Cache-Timestamp', Date.now().toString());

      return originalJson.call(this, data);
    };

    next();
  };
}

//Conditional request middleware

export function conditionalRequest() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const etag = res.get('ETag');
        const lastModified = res.get('Last-Modified');

        const ifNoneMatch = req.get('If-None-Match');
        const ifModifiedSince = req.get('If-Modified-Since');

        if (ifNoneMatch && etag && ifNoneMatch === etag) {
          res.status(304);
          return res.end();
        }

        if (ifModifiedSince && lastModified) {
          const ifModifiedSinceDate = new Date(ifModifiedSince);
          const lastModDate = new Date(lastModified);
          
          if (ifModifiedSinceDate >= lastModDate) {
            res.status(304);
            return res.end();
          }
        }
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

//Cache middleware factory for different resource types
 
export const cacheMiddleware = {
  noCache: () => setCacheHeaders({
    maxAge: 0,
    noStore: true,
    etag: false,
    lastModified: false
  }),

  shortCache: () => setCacheHeaders({
    maxAge: CACHE_DURATIONS.USER_DATA,
    private: true,
    mustRevalidate: true
  }),

  mediumCache: () => setCacheHeaders({
    maxAge: CACHE_DURATIONS.API_DATA,
    private: false,
    mustRevalidate: true
  }),

  longCache: () => setCacheHeaders({
    maxAge: CACHE_DURATIONS.STATIC,
    private: false,
    mustRevalidate: false
  }),

  custom: (options: CacheOptions) => setCacheHeaders(options)
};