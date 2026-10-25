import { optimized, rawEvidenceArchive, stock } from '../../../docs/benchmark-evidence.json';

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
// The raw verifier requires one archived capture per manifest run.
const captureCount = stock.runs.length + optimized.runs.length;

// Public pages use the same checked archive metadata as the methodology page.
export const benchmarkPublication = {
	published: true,
	archiveUrl: rawEvidenceArchive.url,
	archiveSha256: rawEvidenceArchive.sha256,
	captureCount,
	captureCountText: numberWords[captureCount] ?? String(captureCount),
};
