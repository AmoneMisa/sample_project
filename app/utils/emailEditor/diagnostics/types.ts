export type DiagnosticSeverity = "warning" | "error";

export type DiagnosticItem = {
    id: string;
    ruleId: string;
    severity: DiagnosticSeverity;
    message: string;
    startOffset: number;
    endOffset: number;
    approxLine?: number;
};
