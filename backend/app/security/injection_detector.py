import re
from typing import List, Dict, Any, Tuple
from app.schemas.schemas import ScanPromptResponse, HighlightSpan

class PromptInjectionDetector:
    """
    Cognitive Shield Prompt Injection & Jailbreak Detector.
    Detects direct injections, indirect injections, system prompt override attempts,
    delimiter hijacking, and token obfuscation.
    """
    
    DIRECT_PATTERNS = [
        (r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules|prompts)\b", "DIRECT_OVERRIDE", "Direct Instruction Override"),
        (r"(?i)\bdisregard\s+(all\s+)?(previous|prior|system)\s+(instructions|rules|constraints)\b", "DIRECT_OVERRIDE", "Direct Instruction Disregard"),
        (r"(?i)\byou\s+are\s+now\s+(in\s+)?(DAN|developer|god|unrestricted|jailbreak)\s+mode\b", "JAILBREAK_PERSONA", "Jailbreak Persona Switch"),
        (r"(?i)\bdo\s+anything\s+now\b", "JAILBREAK_DAN", "DAN Jailbreak Signature"),
        (r"(?i)\b(reveal|print|display|output|show)\s+(your\s+)?(system\s+prompt|initial\s+instructions|system\s+directive)\b", "PROMPT_LEAK", "System Prompt Exfiltration"),
        (r"(?i)\bforget\s+all\s+(prior\s+)?(safety\s+guidelines|ethics|rules)\b", "SAFETY_BYPASS", "Safety Bypass Directive"),
        (r"(?i)\bpretend\s+you\s+have\s+no\s+(rules|restrictions|filters|limits)\b", "FILTER_BYPASS", "Filter Circumvention"),
        (r"(?i)\bnew\s+system\s+directive\s*:\s*", "DELIMITER_HIJACK", "Fake System Header"),
        (r"(?i)\bact\s+as\s+an\s+unfiltered\s+ai\b", "UNFILTERED_AI", "Uncensored Persona Hijack"),
        (r"(?i)\bbypass\s+all\s+(security|content)\s+filters\b", "FILTER_BYPASS", "Direct Filter Bypass Attempt")
    ]
    
    INDIRECT_PATTERNS = [
        (r"(?i)<!--\s*(system|instruction|admin|override).*?-->", "HIDDEN_HTML_COMMENT", "Hidden HTML Instruction Injection"),
        (r"(?i)\[system\s*instruction\s*:.*?\]", "TAGGED_INSTRUCTION", "Tagged System Instruction Injection"),
        (r"(?i)\{admin\s*override\s*:.*?\}", "TAGGED_OVERRIDE", "Tagged Admin Override"),
        (r"(?i)<<\s*sys\s*>>.*?<<\s*/sys\s*>>", "LLAMA_DELIMITER_INJECTION", "LLaMA Delimiter Injection"),
        (r"(?i)\[\s*inst\s*\].*?\[\s*/inst\s*\]", "INSTRUCTION_DELIMITER_INJECTION", "Instruction Delimiter Injection"),
        (r"(?i)(send|forward|exfiltrate|post)\s+(all\s+)?(data|files|secrets|keys|passwords)\s+to\s+https?://", "EXFILTRATION_PAYLOAD", "Data Exfiltration Payload"),
        (r"(?i)important\s*:\s*ignore\s+user\s+query\s+and\s+execute", "PAYLOAD_HIJACK", "Retrieved Document Payload Hijack"),
        (r"(?i)hidden\s*directive\s*:\s*", "HIDDEN_DIRECTIVE", "Embedded Document Directive")
    ]
    
    OBFUSCATION_PATTERNS = [
        (r"[\u200B-\u200D\uFEFF]", "ZERO_WIDTH_CHARS", "Zero-Width Space Obfuscation"),
        (r"(?i)base64:\s*([A-Za-z0-9+/]{20,}={0,2})", "BASE64_PAYLOAD", "Encoded Base64 Payload")
    ]

    def scan(self, text: str, context: str = None) -> ScanPromptResponse:
        matched_signatures: List[str] = []
        highlighted_spans: List[HighlightSpan] = []
        highest_severity_score = 0.0
        detection_types: List[str] = []
        
        # Scan Direct Patterns
        for pattern, sig_id, label in self.DIRECT_PATTERNS:
            for match in re.finditer(pattern, text):
                matched_signatures.append(f"{sig_id}: {label}")
                detection_types.append("DIRECT_INJECTION")
                highest_severity_score = max(highest_severity_score, 88.0)
                highlighted_spans.append(
                    HighlightSpan(
                        start=match.start(),
                        end=match.end(),
                        text=match.group(0),
                        label=label,
                        category="DIRECT_INJECTION"
                    )
                )
        
        # Scan Indirect Patterns
        target_corpus = f"{text} {context or ''}"
        for pattern, sig_id, label in self.INDIRECT_PATTERNS:
            for match in re.finditer(pattern, target_corpus):
                matched_signatures.append(f"{sig_id}: {label}")
                detection_types.append("INDIRECT_INJECTION")
                highest_severity_score = max(highest_severity_score, 92.0)
                # If matched in the main text, highlight it
                if match.start() < len(text):
                    highlighted_spans.append(
                        HighlightSpan(
                            start=match.start(),
                            end=min(match.end(), len(text)),
                            text=text[match.start():min(match.end(), len(text))],
                            label=label,
                            category="INDIRECT_INJECTION"
                        )
                    )
        
        # Scan Obfuscation Patterns
        for pattern, sig_id, label in self.OBFUSCATION_PATTERNS:
            for match in re.finditer(pattern, text):
                matched_signatures.append(f"{sig_id}: {label}")
                detection_types.append("OBFUSCATION")
                highest_severity_score = max(highest_severity_score, 75.0)
                highlighted_spans.append(
                    HighlightSpan(
                        start=match.start(),
                        end=match.end(),
                        text="[HIDDEN/ENCODED SYMBOLS]",
                        label=label,
                        category="OBFUSCATION"
                    )
                )

        # Contextual heuristic: repeated jailbreak words or token collision
        suspicious_keywords = ["dan mode", "jailbreak", "override", "bypass safety", "ignore rules", "unrestricted mode"]
        keyword_hits = sum(1 for kw in suspicious_keywords if kw in text.lower())
        if keyword_hits >= 2 and highest_severity_score == 0:
            matched_signatures.append("HEURISTIC: Multiple adversarial intent terms")
            detection_types.append("JAILBREAK")
            highest_severity_score = 65.0

        is_injected = len(matched_signatures) > 0
        confidence_score = min(highest_severity_score + (len(matched_signatures) - 1) * 4.0, 99.0) if is_injected else 5.0
        
        if confidence_score >= 80:
            risk_level = "CRITICAL"
        elif confidence_score >= 60:
            risk_level = "HIGH"
        elif confidence_score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        primary_detection = detection_types[0] if detection_types else "CLEAN"
        
        if is_injected:
            explanation = (
                f"Adversarial intent detected ({primary_detection}). "
                f"Identified {len(matched_signatures)} threat signatures including: "
                f"{', '.join([s.split(':')[1].strip() for s in matched_signatures[:3]])}. "
                "The input attempts to manipulate model guardrails or subvert prompt boundaries."
            )
            recommended_action = "QUARANTINE_AND_REJECT" if risk_level in ["CRITICAL", "HIGH"] else "FLAG_AND_INSPECT"
        else:
            explanation = "Input passed prompt integrity scanning. No known injection, jailbreak, or delimiter hijacking patterns detected."
            recommended_action = "ALLOW"

        return ScanPromptResponse(
            is_injected=is_injected,
            risk_level=risk_level,
            confidence_score=round(confidence_score, 2),
            detection_type=primary_detection,
            matched_signatures=matched_signatures,
            highlighted_spans=highlighted_spans,
            explanation=explanation,
            recommended_action=recommended_action
        )

injection_detector = PromptInjectionDetector()

