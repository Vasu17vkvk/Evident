from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.services.note_service import NoteService
from app.services.document_service import DocumentService
from app.api.deps import get_current_user

router = APIRouter(
    prefix="/notes",
    tags=["notes"]
)

@router.get("", response_model=list[NoteResponse])
async def get_notes(current_user: dict = Depends(get_current_user)):
    try:
        notes = await NoteService.get_notes(current_user["_id"])
        return notes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notes: {str(e)}"
        )

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_note(payload: NoteCreate, current_user: dict = Depends(get_current_user)):
    # Verify document ownership if linking a note to a document
    if payload.documentId:
        is_owner = await DocumentService.verify_owner(payload.documentId, current_user["_id"])
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to link this document"
            )
    try:
        note_id = await NoteService.create_note(
            title=payload.title,
            content=payload.content,
            document_id=payload.documentId,
            page_number=payload.pageNumber,
            user_id=current_user["_id"]
        )
        return {"noteId": note_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )

@router.put("/{noteId}", status_code=status.HTTP_200_OK)
async def update_note(noteId: str, payload: NoteUpdate, current_user: dict = Depends(get_current_user)):
    # Verify note ownership
    is_owner = await NoteService.verify_owner(noteId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this note"
        )
    # Verify document ownership if linking a note to a document
    if payload.documentId:
        is_owner = await DocumentService.verify_owner(payload.documentId, current_user["_id"])
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to link this document"
            )
    try:
        success = await NoteService.update_note(noteId, payload.model_dump())
        return {"status": "success", "message": "Note updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}"
        )

@router.delete("/{noteId}", status_code=status.HTTP_200_OK)
async def delete_note(noteId: str, current_user: dict = Depends(get_current_user)):
    # Verify note ownership
    is_owner = await NoteService.verify_owner(noteId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this note"
        )
    try:
        success = await NoteService.delete_note(noteId)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note with ID {noteId} not found."
            )
        return {"status": "success", "message": "Note deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}"
        )
