import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger, defineConfig } from 'vite';
import type { PluginOption } from 'vite';

const baseLogger = createLogger();

function shouldSuppressWarning(message: string) {
  return message.includes('[INVALID_ANNOTATION]') && message.includes('@vueuse/core/dist/index.js');
}

const logger = {
  ...baseLogger,
  warn(message: string, options?: Parameters<typeof baseLogger.warn>[1]) {
    if (shouldSuppressWarning(message)) return;

    baseLogger.warn(message, options);
  },
  warnOnce(message: string, options?: Parameters<typeof baseLogger.warnOnce>[1]) {
    if (shouldSuppressWarning(message)) return;

    baseLogger.warnOnce(message, options);
  },
};

function replaceCopilotRobotPlugin(): PluginOption {
  return {
    name: 'replace-copilot-robot',
    enforce: 'pre',
    transform(code) {
      return code.replaceAll('🤖', '<span class=copilot></span>').replaceAll('🧑', '<span class=human></span>').replaceAll('👩', '<span class=woman></span>');
    },
  };
}

function assetCacheBusterPlugin(): PluginOption {
  let publicDir: string;

  function rewriteUrls(code: string): string {
    return code.replace(/(['"`])(\/(?:assets\/[^'"`?#\s]+|favicon\.(?:svg|ico)))/g, (_, quote, url) => {
      try {
        const filePath = join(publicDir, url);
        const content = readFileSync(filePath);
        const hash = createHash('sha256').update(content).digest('base64url').slice(0, 10);
        return `${quote}${url}?v=${hash}`;
      } catch {
        return `${quote}${url}`;
      }
    });
  }

  return {
    name: 'asset-cache-buster',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    transformIndexHtml(html) {
      return rewriteUrls(html);
    },
    renderChunk(code) {
      const rewritten = rewriteUrls(code);
      return rewritten !== code ? { code: rewritten } : null;
    },
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'asset' && typeof chunk.source === 'string') {
          chunk.source = rewriteUrls(chunk.source);
        }
      }
    },
  };
}

export default defineConfig({
  customLogger: logger,
  plugins: [replaceCopilotRobotPlugin(), assetCacheBusterPlugin()],
});
