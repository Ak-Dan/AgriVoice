import { Disease } from "./diseases.ts"

export type Severity = "low" | "medium" | "high"

export type Inference = {
    output: Disease
    confidence: number
    severity: Severity
}
