from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Document, DocumentChunk, User
from app.schemas.schemas import DocumentResponse, DocumentChunkResponse, RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import rag_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/rag", tags=["RAG Security Inspector"])

@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = db.query(Document).order_by(Document.id.desc()).all()
    res = []
    for d in docs:
        d_dict = DocumentResponse.model_validate(d)
        d_dict.chunks_count = len(d.chunks)
        res.append(d_dict)
    return res

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    try:
        text_content = contents.decode("utf-8")
    except UnicodeDecodeError:
        text_content = contents.decode("latin-1", errors="replace")
        
    doc_title = title or file.filename or "Uploaded Document"
    file_type = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "txt"
    
    doc = rag_service.ingest_document(
        db=db,
        title=doc_title,
        filename=file.filename or "uploaded.txt",
        content=text_content,
        file_type=file_type
    )
    doc_dict = DocumentResponse.model_validate(doc)
    doc_dict.chunks_count = len(doc.chunks)
    return doc_dict

@router.post("/query", response_model=RAGQueryResponse)
def query_rag_knowledge(
    req: RAGQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return rag_service.search_and_synthesize(db, req.query, top_k=req.top_k)

@router.get("/documents/{doc_id}/chunks", response_model=List[DocumentChunkResponse])
def get_document_chunks(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index.asc()).all()
    return chunks

