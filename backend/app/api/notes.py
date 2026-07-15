from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.services.note_service import NoteService
from app.services.document_service import DocumentService
from app.api.deps import get_current_user

router = APIRouter(
    prefix="/notes",
    tags=["notes"]
)

@router.get("", response_model=list[NoteResponse])
async def get_notes(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    try:
        notes = await NoteService.get_notes(current_user["_id"], page=page, limit=limit)
        return notes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notes: {str(e)}"
        )

@router.get("/document/{documentId}", response_model=list[NoteResponse])
async def get_document_notes(
    documentId: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    # Verify document ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access notes for this document"
        )
    try:
        notes = await NoteService.get_notes_by_document(documentId, current_user["_id"], page=page, limit=limit)
        return notes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document notes: {str(e)}"
        )

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_note(payload: NoteCreate, current_user: dict = Depends(get_current_user)):
    # user_id is always taken from the verified JWT — never trusted from the frontend payload
    user_id = current_user["_id"]
    doc_id = payload.documentId or payload.document_id
    page_num = payload.pageNumber or payload.page_number
    src_text = payload.sourceText or payload.source_text

    # Structured backend logs as required
    import logging
    logger = logging.getLogger("evident")
    logger.info(
        "Note creation requested",
        extra={
            "user_id": user_id,
            "document_id": doc_id,
            "note_title": payload.title
        }
    )
    # Also plain-print for immediate visibility in uvicorn output
    print(f"[notes] create_note | user_id={user_id} | document_id={doc_id} | title={payload.title!r}")

    # Verify document ownership before attaching document_id
    if doc_id:
        is_owner = await DocumentService.verify_owner(doc_id, user_id)
        if not is_owner:
            logger.warning(
                f"[notes] User {user_id} does not own document {doc_id} — refusing to link note"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to link this document"
            )
    try:
        note_id = await NoteService.create_note(
            title=payload.title,
            content=payload.content,
            document_id=doc_id,
            page_number=page_num,
            user_id=user_id,
            source_text=src_text
        )
        logger.info(f"[notes] Note created successfully | note_id={note_id} | user_id={user_id}")
        print(f"[notes] Note created | note_id={note_id} | user_id={user_id}")

        # Log note creation activity
        doc_name = None
        if doc_id:
            doc = await DocumentService.get_document(doc_id, user_id=user_id)
            if doc:
                doc_name = doc.get("filename")

        from app.services.activity_service import ActivityService
        await ActivityService.create_activity(
            user_id=user_id,
            activity_type="create_note",
            action="Created note",
            document_name=doc_name,
            document_id=doc_id
        )

        return {"noteId": note_id}
    except Exception as e:
        logger.error(f"[notes] Note creation failed | user_id={user_id} | error={e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_note(id: str, payload: NoteUpdate, current_user: dict = Depends(get_current_user)):
    # Verify note ownership (single-query {_id, userId} check)
    is_owner = await NoteService.verify_owner(id, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this note"
        )
    # Verify document ownership if linking a note to a document
    doc_id = payload.documentId or payload.document_id
    if doc_id:
        is_doc_owner = await DocumentService.verify_owner(doc_id, current_user["_id"])
        if not is_doc_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to link this document"
            )
    try:
        # Pass user_id so the service-layer filter also enforces ownership
        await NoteService.update_note(id, payload.model_dump(), user_id=current_user["_id"])
        return {"status": "success", "message": "Note updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}"
        )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_note(id: str, current_user: dict = Depends(get_current_user)):
    # Verify note ownership (single-query {_id, userId} check)
    is_owner = await NoteService.verify_owner(id, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this note"
        )
    try:
        # Pass user_id so the service-layer delete is also scoped to the owner
        success = await NoteService.delete_note(id, user_id=current_user["_id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {id} not found."
            )
        return {"status": "success", "message": "Note deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}"
        )
