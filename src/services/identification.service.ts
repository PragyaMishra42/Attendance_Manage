import { IdentificationResult, DetectedFaceMatch } from "@/types/attendance";
import { Student } from "@/types/student";

export interface FaceIdentificationProvider {
  readonly name: string;
  readonly isMock: boolean;
  identifyStudents(
    imageDataUrl: string,
    classRoster: Student[]
  ): Promise<IdentificationResult>;
}

/**
 * Demonstration AI identification provider used when no external face-recognition
 * service is configured. Clearly marked as a mock so teachers always verify matches.
 */
class MockFaceIdentificationProvider implements FaceIdentificationProvider {
  readonly name = "SmartAttend Demo Matcher (Mock)";
  readonly isMock = true;

  async identifyStudents(
    _imageDataUrl: string,
    classRoster: Student[]
  ): Promise<IdentificationResult> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    const consentedRoster = classRoster.filter((s) => s.photo_consent);
    const matches: DetectedFaceMatch[] = consentedRoster
      .slice(0, Math.max(1, consentedRoster.length - 1))
      .map((student, index) => {
        const confidence = Math.max(68, 97 - index * 5);
        return {
          face_id: `face-${index + 1}`,
          bounding_box: {
            x: 12 + (index % 4) * 22,
            y: 18 + Math.floor(index / 4) * 35,
            width: 16,
            height: 24,
          },
          matched_student_id: student.id,
          confidence_score: confidence,
          is_mock: true,
        };
      });

    const unidentifiedFaceIds = ["face-unknown-1"];
    matches.push({
      face_id: "face-unknown-1",
      bounding_box: { x: 76, y: 54, width: 16, height: 24 },
      matched_student_id: null,
      confidence_score: 0,
      is_mock: true,
    });

    return {
      provider_name: this.name,
      is_mock: true,
      processed_at: new Date().toISOString(),
      total_faces_detected: matches.length,
      matches,
      unidentified_face_ids: unidentifiedFaceIds,
    };
  }
}

class IdentificationService {
  private provider: FaceIdentificationProvider;

  constructor(provider?: FaceIdentificationProvider) {
    this.provider = provider ?? new MockFaceIdentificationProvider();
  }

  setProvider(provider: FaceIdentificationProvider) {
    this.provider = provider;
  }

  getProviderInfo() {
    return {
      name: this.provider.name,
      isMock: this.provider.isMock,
    };
  }

  async identifyFromCapture(
    imageDataUrl: string,
    classRoster: Student[]
  ): Promise<IdentificationResult> {
    return this.provider.identifyStudents(imageDataUrl, classRoster);
  }
}

export const identificationService = new IdentificationService();
