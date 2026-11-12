// Minimal ZIP reader for the published benchmark archive, so scripts read capture data straight
// from the checksum-verified file instead of trusting a separately extracted copy.
// Supports stored and deflated entries in a classic (non-ZIP64) archive, and checks every CRC.
import { Buffer } from 'node:buffer';
import { crc32, inflateRawSync } from 'node:zlib';

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;

/** @returns {Map<string, Buffer>} entry name (as stored) -> uncompressed contents */
export function readZipEntries(archive) {
	// The end record sits in the last 22 bytes plus an optional comment of up to 65,535 bytes.
	let end = -1;
	for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 22 - 0xffff); offset -= 1) {
		if (archive.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) { end = offset; break; }
	}
	if (end === -1) throw new Error('Not a ZIP archive: end of central directory not found');
	const count = archive.readUInt16LE(end + 10);
	let cursor = archive.readUInt32LE(end + 16);
	if (count === 0xffff || cursor === 0xffffffff) throw new Error('ZIP64 archives are not supported');

	const entries = new Map();
	for (let index = 0; index < count; index += 1) {
		if (archive.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_ENTRY) throw new Error('Corrupt ZIP central directory');
		const flags = archive.readUInt16LE(cursor + 8);
		const method = archive.readUInt16LE(cursor + 10);
		const expectedCrc = archive.readUInt32LE(cursor + 16);
		const compressedSize = archive.readUInt32LE(cursor + 20);
		const size = archive.readUInt32LE(cursor + 24);
		const nameLength = archive.readUInt16LE(cursor + 28);
		const extraLength = archive.readUInt16LE(cursor + 30);
		const commentLength = archive.readUInt16LE(cursor + 32);
		const localOffset = archive.readUInt32LE(cursor + 42);
		const name = archive.toString(flags & 0x800 ? 'utf8' : 'latin1', cursor + 46, cursor + 46 + nameLength);
		cursor += 46 + nameLength + extraLength + commentLength;
		if (name.endsWith('/')) continue;
		if (flags & 0x1) throw new Error(`Encrypted ZIP entry ${name} is not supported`);

		if (archive.readUInt32LE(localOffset) !== LOCAL_FILE_HEADER) throw new Error(`Corrupt local header for ${name}`);
		const dataStart = localOffset + 30 + archive.readUInt16LE(localOffset + 26) + archive.readUInt16LE(localOffset + 28);
		const stored = archive.subarray(dataStart, dataStart + compressedSize);
		let contents;
		if (method === 0) contents = Buffer.from(stored);
		else if (method === 8) contents = inflateRawSync(stored);
		else throw new Error(`Unsupported compression method ${method} for ${name}`);
		if (contents.length !== size || crc32(contents) !== expectedCrc) throw new Error(`CRC or size mismatch for ${name}`);
		entries.set(name, contents);
	}
	return entries;
}
