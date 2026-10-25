import { Buffer } from 'node:buffer';
import { crc32, deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { readZipEntries } from './read-zip.js';

// Builds a classic ZIP with one stored and one deflated entry, the two methods the reader supports.
function buildZip(files) {
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const { name, data, deflate } of files) {
		const nameBytes = Buffer.from(name, 'utf8');
		const body = deflate ? deflateRawSync(data) : data;
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(deflate ? 8 : 0, 8);
		local.writeUInt32LE(crc32(data), 14);
		local.writeUInt32LE(body.length, 18);
		local.writeUInt32LE(data.length, 22);
		local.writeUInt16LE(nameBytes.length, 26);
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(0x800, 8);
		central.writeUInt16LE(deflate ? 8 : 0, 10);
		central.writeUInt32LE(crc32(data), 16);
		central.writeUInt32LE(body.length, 20);
		central.writeUInt32LE(data.length, 24);
		central.writeUInt16LE(nameBytes.length, 28);
		central.writeUInt32LE(offset, 42);
		locals.push(local, nameBytes, body);
		centrals.push(central, nameBytes);
		offset += local.length + nameBytes.length + body.length;
	}
	const directory = Buffer.concat(centrals);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(files.length, 8);
	end.writeUInt16LE(files.length, 10);
	end.writeUInt32LE(directory.length, 12);
	end.writeUInt32LE(offset, 16);
	return Buffer.concat([...locals, directory, end]);
}

describe('readZipEntries', () => {
	const capture = Buffer.from('﻿{"Runs":[{"CaptureData":{"MsBetweenPresents":[1.5,2.5]}}]}', 'utf8');
	const files = [
		{ name: 'evidence/CapFrameX-a.json', data: capture, deflate: true },
		{ name: 'benchmark-evidence.json', data: Buffer.from('{"ok":true}'), deflate: false },
	];

	it('reads stored and deflated entries byte for byte', () => {
		const entries = readZipEntries(buildZip(files));
		expect([...entries.keys()]).toEqual(files.map((file) => file.name));
		expect(entries.get('evidence/CapFrameX-a.json').equals(capture)).toBe(true);
		expect(entries.get('benchmark-evidence.json').toString()).toBe('{"ok":true}');
	});

	it('rejects an archive whose entry data was altered', () => {
		const archive = buildZip(files);
		// Flip a byte inside the stored entry: the CRC no longer matches.
		const index = archive.indexOf('{"ok":true}');
		archive[index + 2] ^= 0x01;
		expect(() => readZipEntries(archive)).toThrow(/CRC or size mismatch/);
	});

	it('rejects input that is not a ZIP archive', () => {
		expect(() => readZipEntries(Buffer.from('not a zip file at all, just text padding it out'))).toThrow(/Not a ZIP archive/);
	});
});
