import pino from 'pino';
import config from './config.js';

const logger = pino({
  level: config.isProd ? 'info' : 'debug',
  transport: config.isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss.l' },
      },
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'password',
      'passwordHash',
      '*.password',
      '*.passwordHash',
    ],
    remove: true,
  },
});

export default logger;