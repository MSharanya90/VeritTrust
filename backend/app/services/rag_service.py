import hashlib
import json
import math
import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sqlalchemy.orm import Session
from app.models.models import Document, DocumentChunk
from app.security.injection_detector import injection_detector
from app.schemas.schemas import RAGQueryResponse, RAGQueryCitation

class RAGSecurityService:
    """
    RAG Pipeline Security Inspector.
    Chunks documents, indexes semantic vectors, detects poisoned payloads,
    and maps retrieval citations with influence weights.
    """
    
    @staticmethod
    def _compute_hash(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    @staticmethod
    def _simple_vectorize(text: str, vocab_size: int = 128) -> List[float]:
        """
        Deterministic lightweight bag-of-words / character n-gram hashing vectorizer.
        Generates fixed-size 128-dimensional unit-normalized embedding without requiring external model download.
        """
        words = re.findall(r"\w+", text.lower())
        vec = np.zeros(vocab_size, dtype=float)
        if not words:
            return vec.tolist()
            
        for w in words:
            # Deterministic hash to dimension
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16) % vocab_size
            vec[h] += 1.0
            
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    @staticmethod
    def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        a = np.array(vec1, dtype=float)
        b = np.array(vec2, dtype=float)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def ingest_document(
        self,
        db: Session,
        title: str,
        filename: str,
        content: str,
        file_type: str = "txt",
        chunk_size: int = 350
    ) -> Document:
        doc_hash = self._compute_hash(content)
        
        # Check if already ingested
        existing = db.query(Document).filter(Document.content_hash == doc_hash).first()
        if existing:
            return existing

        # Chunk the content by paragraphs or character size
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        chunks_text = []
        
        current_chunk = ""
        for p in paragraphs:
            if len(current_chunk) + len(p) < chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + p
            else:
                if current_chunk:
                    chunks_text.append(current_chunk)
                current_chunk = p
        if current_chunk:
            chunks_text.append(current_chunk)
            
        if not chunks_text:
            chunks_text = [content[:chunk_size]]

        # Detect if any chunk has suspicious poisoned payloads
        has_poison = False
        doc = Document(
            title=title,
            filename=filename,
            file_type=file_type,
            file_size=len(content.encode("utf-8")),
            content_hash=doc_hash,
            is_poisoned=False
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        for idx, c_text in enumerate(chunks_text):
            scan_result = injection_detector.scan(c_text)
            is_suspicious = scan_result.is_injected
            if is_suspicious:
                has_poison = True
                
            embedding = self._simple_vectorize(c_text)
            
            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=idx + 1,
                content=c_text,
                embedding_json=json.dumps(embedding),
                token_count=len(c_text.split()),
                has_suspicious_payload=is_suspicious,
                suspicious_details=scan_result.explanation if is_suspicious else None
            )
            db.add(chunk)

        if has_poison:
            doc.is_poisoned = True
            
        db.commit()
        db.refresh(doc)
        return doc

    def search_and_synthesize(
        self,
        db: Session,
        query: str,
        top_k: int = 4
    ) -> RAGQueryResponse:
        chunks = db.query(DocumentChunk).all()
        if not chunks:
            return RAGQueryResponse(
                query=query,
                synthesized_answer="No ingested enterprise documents available in knowledge repository.",
                citations=[],
                contains_poisoned_source=False,
                security_verdict="NO_DATA",
                provenance_hash=self._compute_hash(query)
            )

        query_vec = self._simple_vectorize(query)
        scored_chunks = []

        for chunk in chunks:
            if not chunk.embedding_json:
                continue
            emb = json.loads(chunk.embedding_json)
            sim = self._cosine_similarity(query_vec, emb)
            scored_chunks.append((sim, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_chunks[:top_k]

        total_sim = sum(max(0.01, m[0]) for m in top_matches) if top_matches else 1.0

        citations: List[RAGQueryCitation] = []
        contains_poison = False
        context_snippets = []

        for sim, chunk in top_matches:
            weight = round(max(0.01, sim) / total_sim, 3)
            doc = chunk.document
            if chunk.has_suspicious_payload:
                contains_poison = True
                
            citations.append(
                RAGQueryCitation(
                    document_id=chunk.document_id,
                    chunk_id=chunk.id,
                    document_title=doc.title if doc else "Corporate Document",
                    snippet=chunk.content[:200] + ("..." if len(chunk.content) > 200 else ""),
                    similarity_score=round(float(sim), 3),
                    influence_weight=weight,
                    is_poisoned=chunk.has_suspicious_payload,
                    poison_warning=chunk.suspicious_details
                )
            )
            context_snippets.append(f"[{doc.title if doc else 'Doc'} (Chunk #{chunk.chunk_index})]: {chunk.content}")

        if contains_poison:
            verdict = "POISONED_CHUNKS_BLOCKED"
            synthesized_answer = (
                "[SECURITY SHIELD ALERT]: One or more retrieved document passages contain indirect prompt injection "
                "or covert override instructions. The response synthesis was intercepted by VeriTrust to protect agent integrity."
            )
        else:
            verdict = "VERIFIED_SAFE"
            # Deterministic, grounded factual synthesis
            top_snippet = top_matches[0][1].content if top_matches else ""
            synthesized_answer = (
                f"Based on verified repository documents ({citations[0].document_title if citations else 'KB'}), "
                f"the system retrieved authoritative evidence for your query '{query}'. "
                f"Primary findings: {top_snippet[:240]}..."
            )

        provenance_hash = self._compute_hash(f"{query}|{verdict}|{len(citations)}")

        return RAGQueryResponse(
            query=query,
            synthesized_answer=synthesized_answer,
            citations=citations,
            contains_poisoned_source=contains_poison,
            security_verdict=verdict,
            provenance_hash=provenance_hash
        )

rag_service = RAGSecurityService()

