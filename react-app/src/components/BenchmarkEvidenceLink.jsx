import { benchmarkPublication } from '../data/benchmarkPublication';
import './BenchmarkEvidenceLink.css';

export default function BenchmarkEvidenceLink() {
  return <a className="benchmark-evidence-link" href={benchmarkPublication.archiveUrl}>Download the four raw CapFrameX captures</a>;
}
