export interface DiagnosisInput {
  board: string;
  component: string;
  powerSource: string;
  problemCategory: string;
  expectedBehavior: string;
  actualBehavior: string;
  errorMessage?: string;
  notes?: string;
  evidenceType: "photo" | "screenshot" | "text_only";
}

export interface Measurement {
  id: string;
  type: "Voltage" | "Resistance" | "Current" | "Signal/PWM" | "I2C/SPI Scan" | "Continuity/Short" | "Other";
  location: string;
  value: string;
  unit: string;
  notes?: string;
  timestamp: string;
  isUserReported: true;
}

export interface DiagnosisResult {
  issue_summary: string;
  components_detected: string[];
  potential_causes: string[];
  troubleshooting_steps: string[];
  safetyLevel?: "SAFE" | "CAUTION" | "HAZARD";
  currentDiagnosticStep?: string;
  followUpQuestions?: string[];
  imageUsable?: boolean;
  imageLimitations?: string[];
}

export interface DiagnosisRecord {
  id?: string;
  userId?: string;
  version?: string;
  createdAt: any;
  updatedAt?: any;
  resolvedAt?: any;
  status: "in_progress" | "resolved" | "partially_resolved" | "needs_review";
  setup: {
    board: string;
    component: string;
    powerSource: string;
    problemCategory: string;
  };
  originalInput: {
    expectedBehavior: string;
    actualBehavior: string;
    errorMessage?: string;
    notes?: string;
    evidenceType: string;
  };
  result: DiagnosisResult;
  resolution?: {
    rootCause?: string;
    actionTaken?: string;
    finalNote?: string;
    resolvedAt?: any;
  };
  measurements?: Measurement[];
  followUpMessages?: Array<{
    role: "user" | "model";
    text: string;
    timestamp: any;
  }>;
}

