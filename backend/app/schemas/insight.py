from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FactItem(BaseModel):
    label: str
    value: str
    change: str
    icon: str

class PersonEntity(BaseModel):
    name: str
    role: Optional[str] = None
    mentions: int

class OrgEntity(BaseModel):
    name: str
    role: Optional[str] = None
    mentions: int

class LocEntity(BaseModel):
    name: str
    mentions: int

class EntitiesContainer(BaseModel):
    people: List[PersonEntity] = []
    organizations: List[OrgEntity] = []
    locations: List[LocEntity] = []

class TimelineEvent(BaseModel):
    date: str
    title: str
    description: str
    page: int = 1

class InsightsResponse(BaseModel):
    documentId: str
    executiveSummary: str
    documentPurpose: str
    facts: List[FactItem] = []
    entities: EntitiesContainer
    timeline: List[TimelineEvent] = []
    generationTimestamp: datetime
    modelUsed: str
