import type { ImportDetector } from "@/lib/intelligence/imports/contracts";
import type {
  DetectionResult,
  ImportDetectionInput,
} from "@/lib/intelligence/imports/types";
import {
  DEFAULT_PLATFORM_DETECTORS,
  detectionScoreToResult,
  type PlatformFileDetector,
} from "@/lib/intelligence/imports/detection/platformDetectors";
import { inferFileFormat } from "@/lib/intelligence/imports/detection/utils";

const MIN_CONFIDENCE = 0.3;

export class IntelligenceFileDetector implements ImportDetector {
  constructor(private readonly platformDetectors: readonly PlatformFileDetector[] = DEFAULT_PLATFORM_DETECTORS) {}

  async detect(input: ImportDetectionInput): Promise<DetectionResult> {
    const [bestScore] = this.platformDetectors
      .map((detector) => detector.score(input))
      .sort((left, right) => right.confidence - left.confidence);

    if (!bestScore || bestScore.confidence < MIN_CONFIDENCE) {
      return {
        platform: "unknown",
        format: inferFileFormat(input.file),
        confidence: bestScore ? Number(bestScore.confidence.toFixed(2)) : 0,
        issues: [
          {
            stage: "detect",
            code: "unknown-platform",
            message: "Não foi possível identificar a plataforma do arquivo.",
          },
        ],
      };
    }

    return detectionScoreToResult(bestScore);
  }
}

export const intelligenceFileDetector = new IntelligenceFileDetector();
