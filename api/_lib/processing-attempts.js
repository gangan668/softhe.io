const { redisCommand } = require('./redis');

const INDEX = 'operations:pending-processing';
const RECORDS = 'operations:processing-attempts';
const STUCK_AFTER_MS = 15 * 60 * 1000;
const RETENTION_SECONDS = 400 * 86400;
const validIdentity = (kind, sessionId) => ['stripe', 'fulfillment'].includes(kind) && /^cs_[A-Za-z0-9_]+$/.test(sessionId);

const beginProcessing = async (kind, sessionId, attemptId, now = Date.now(), command = redisCommand) => {
  if (!validIdentity(kind, sessionId) || !/^[a-f0-9-]{36}$/i.test(attemptId)) throw new Error('Invalid processing identity');
  const member = `${kind}:${sessionId}`;
  // Preserve the earliest unresolved start across retries. The retained index
  // contains session IDs and attempt tokens, never customer details or bodies.
  const script = "redis.call('ZADD', KEYS[1], 'NX', ARGV[1], ARGV[2]); redis.call('HSET', KEYS[2], ARGV[2], ARGV[3]); redis.call('EXPIRE', KEYS[1], ARGV[4]); redis.call('EXPIRE', KEYS[2], ARGV[4]); return 1";
  await command(['EVAL', script, 2, INDEX, RECORDS, now, member, attemptId, RETENTION_SECONDS]);
  return member;
};

const finishProcessing = (member, attemptId, command = redisCommand) => command(['EVAL',
  "if redis.call('HGET', KEYS[2], ARGV[1]) == ARGV[2] then redis.call('HDEL', KEYS[2], ARGV[1]); return redis.call('ZREM', KEYS[1], ARGV[1]) end return 0",
  2, INDEX, RECORDS, member, attemptId]);

const reconcileProcessing = async (now = Date.now(), command = redisCommand) => {
  // One atomic, bounded Redis call avoids per-record network requests and races
  // with a completion/retry while the monitor checks terminal stage markers.
  const script = [
    "local members = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, 100)",
    "local pending = {stripe=0, fulfillment=0}; local reconciled=0",
    "for _, member in ipairs(members) do",
    "local kind, session = string.match(member, '^([^:]+):(.+)$')",
    "if (kind ~= 'stripe' and kind ~= 'fulfillment') or not session or not redis.call('HGET', KEYS[2], member) then return redis.error_reply('Invalid processing index record') end",
    "local completion = kind == 'stripe' and ('stripe:fulfilled:' .. session) or ('fulfillment:order:' .. session)",
    "if redis.call('EXISTS', completion) == 1 then redis.call('HDEL', KEYS[2], member); redis.call('ZREM', KEYS[1], member); reconciled=reconciled+1 else pending[kind]=pending[kind]+1 end",
    "end",
    "return cjson.encode({pending=pending,reconciled=reconciled,checked=#members,truncated=(#members==100),stuckAfterSeconds=900})",
  ].join(' ');
  const result = JSON.parse(await command(['EVAL', script, 2, INDEX, RECORDS, now - STUCK_AFTER_MS]));
  if (!Number.isInteger(result.checked) || !Number.isInteger(result.pending?.stripe) || !Number.isInteger(result.pending?.fulfillment)) throw new Error('Invalid processing reconciliation response');
  return result;
};

module.exports = { beginProcessing, finishProcessing, reconcileProcessing, STUCK_AFTER_MS, RETENTION_SECONDS };
