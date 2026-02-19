export type DiagnosticSeverity = "warning" | "error";

export type DiagnosticItem = {
    id: string;
    ruleId: string;
    severity: DiagnosticSeverity;
    messageKey: string;
    messageParams?: Record<string, any>;
    startOffset: number;
    endOffset: number;
    approxLine?: number;
};
