import re
from typing import List, Tuple
from app.schemas.schemas import DataLeakageScanResponse, LeakedEntity

class DataLeakageDetector:
    """
    Enterprise Data Leakage & Secret Scanner.
    Detects API keys, credentials, PII (Email, Phone, SSN, Credit Cards),
    database connection strings, and private cryptographic keys.
    """
    
    PATTERNS = [
        ("API_KEY_OPENAI", r"\bsk-[a-zA-Z0-9-_]{20,}\b", "OpenAI Secret Key"),
        ("API_KEY_AWS", r"\bAKIA[0-9A-Z]{16}\b", "AWS Access Key ID"),
        ("API_KEY_GITHUB", r"\bgh[pousr]_[A-Za-z0-9_]{36,}\b", "GitHub Token"),
        ("AUTH_BEARER_TOKEN", r"(?i)bearer\s+([a-zA-Z0-9_\-\.]{25,})", "Bearer Authorization Token"),
        ("PRIVATE_KEY", r"-----BEGIN\s+(?:[A-Z\s]+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:[A-Z\s]+)?PRIVATE\s+KEY-----", "Cryptographic Private Key"),
        ("DB_CONNECTION_STRING", r"(?i)\b(postgres|postgresql|mysql|mongodb|redis):\/\/[^\s:]+:[^\s@]+@[^\s]+", "Database URI with Credentials"),
        ("PASSWORD_ASSIGNMENT", r"(?i)(?:password|passwd|pwd|secret|api_secret)\s*[:=]\s*['\"]([^'\"\s]{6,})['\"]", "Plaintext Password Assignment"),
        ("CREDIT_CARD", r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b", "Payment Card (PAN)"),
        ("SSN", r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b", "US Social Security Number"),
        ("EMAIL", r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b", "Email Address"),
        ("PHONE", r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", "Phone Number")
    ]

    def _mask_value(self, val: str, entity_type: str) -> str:
        if entity_type in ["API_KEY_OPENAI", "API_KEY_AWS", "API_KEY_GITHUB", "AUTH_BEARER_TOKEN"]:
            if len(val) > 8:
                return val[:4] + "•" * (len(val) - 8) + val[-4:]
            return "••••••••"
        elif entity_type == "EMAIL":
            parts = val.split("@")
            if len(parts) == 2:
                name, domain = parts
                masked_name = name[0] + "•••" if len(name) > 1 else "•"
                return f"{masked_name}@{domain}"
            return "••••@••••"
        elif entity_type in ["CREDIT_CARD", "SSN"]:
            return "•••-••-" + val[-4:]
        elif entity_type == "PASSWORD_ASSIGNMENT":
            return "••••••••"
        elif entity_type == "PRIVATE_KEY":
            return "[PROTECTED PRIVATE KEY]"
        elif entity_type == "DB_CONNECTION_STRING":
            return re.sub(r"://([^:]+):([^@]+)@", r"://\1:••••••••@", val)
        return "••••••••"

    def scan(self, text: str, mask_result: bool = True) -> DataLeakageScanResponse:
        entities: List[LeakedEntity] = []
        masked_text = text
        
        for entity_code, pattern, entity_name in self.PATTERNS:
            for match in re.finditer(pattern, text):
                raw_val = match.group(0)
                # If group 1 exists, use it as the sensitive part
                if match.groups() and match.group(1):
                    val_to_mask = match.group(1)
                    masked = self._mask_value(val_to_mask, entity_code)
                    masked_full = raw_val.replace(val_to_mask, masked)
                else:
                    masked = self._mask_value(raw_val, entity_code)
                    masked_full = masked
                    
                entities.append(
                    LeakedEntity(
                        entity_type=entity_code,
                        original_value=raw_val if len(raw_val) < 80 else raw_val[:40] + "...",
                        masked_value=masked_full if len(masked_full) < 80 else masked_full[:40] + "...",
                        start=match.start(),
                        end=match.end(),
                        confidence=0.95
                    )
                )

        # Sort entities by start index descending so replacement in string doesn't invalidate offsets
        sorted_entities = sorted(entities, key=lambda e: e.start, reverse=True)
        for e in sorted_entities:
            masked_text = masked_text[:e.start] + e.masked_value + masked_text[e.end:]

        has_leakage = len(entities) > 0
        leak_count = len(entities)
        
        # Risk level determination
        has_critical = any(e.entity_type in ["PRIVATE_KEY", "DB_CONNECTION_STRING", "API_KEY_AWS", "API_KEY_OPENAI", "PASSWORD_ASSIGNMENT"] for e in entities)
        has_high = any(e.entity_type in ["CREDIT_CARD", "SSN", "AUTH_BEARER_TOKEN", "API_KEY_GITHUB"] for e in entities)
        
        if has_critical:
            risk_level = "CRITICAL"
        elif has_high:
            risk_level = "HIGH"
        elif has_leakage:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        if has_leakage:
            types = set(e.entity_type for e in entities)
            explanation = (
                f"Data leakage detected! Found {leak_count} sensitive artifact(s) of type: {', '.join(types)}. "
                "Immediate redaction applied to prevent exfiltration or log exposure."
            )
        else:
            explanation = "No sensitive PII, API tokens, passwords, or cryptographic secrets detected in text."

        return DataLeakageScanResponse(
            has_leakage=has_leakage,
            leak_count=leak_count,
            risk_level=risk_level,
            entities=entities,
            masked_text=masked_text if mask_result else text,
            explanation=explanation
        )

leakage_detector = DataLeakageDetector()

