import { rawEvidenceArchive } from '../../../docs/benchmark-evidence.json';

// Public pages use the same checked archive metadata as the methodology page.
export const benchmarkPublication = {
	published: true,
	archiveUrl: rawEvidenceArchive.url,
	archiveSha256: rawEvidenceArchive.sha256,
};
