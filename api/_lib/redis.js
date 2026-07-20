const { fetchWithTimeout } = require('./fetch');

const getRedisConfig = () => ({
	url: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, ''),
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const redisCommand = async (command, fetchImpl = fetch) => {
	const { url, token } = getRedisConfig();
	if (!url || !token) throw new Error('Durable storage is not configured');

	const response = await fetchWithTimeout(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(command),
	}, fetchImpl);
	const data = await response.json().catch(() => ({}));
	if (!response.ok || data.error) throw new Error(data.error || 'Durable storage request failed');
	return data.result;
};

const incrementWithExpiry = async (key, ttlSeconds) => {
	const script = [
		"local current = redis.call('INCR', KEYS[1])",
		"if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
		'return current',
	].join(' ');
	return Number(await redisCommand(['EVAL', script, 1, key, ttlSeconds]));
};

const claimKey = async (key, value, ttlSeconds) => {
	const result = await redisCommand(['SET', key, value, 'NX', 'EX', ttlSeconds]);
	return result === 'OK';
};

const setKey = (key, value, ttlSeconds) => redisCommand(['SET', key, value, 'EX', ttlSeconds]);
const deleteKey = (key) => redisCommand(['DEL', key]);

module.exports = { claimKey, deleteKey, incrementWithExpiry, redisCommand, setKey };
