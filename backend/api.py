# File: backend/api.py

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any

# Import all necessary functions from logic.py
from logic import (
    kickstart_chatbot,             # For onboarding dream conversation
    invoke_user_chatbot,           # For registered PersonaPulse user bots
    generate_sidebar_content_logic,# For sidebar of user bots
    search_persona_profiles_logic, # For dashboard user search
    start_dashboard_dream_chat     # NEW: For dashboard initiated dynamic dream personas
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request Schemas ---

# For original /chat (onboarding dream conversation)
class OnboardingDreamChatRequest(BaseModel):
    user_id: str # User undergoing onboarding, whose dream_conversation record is used
    is_chat_empty: bool
    chat_history: List[Dict[str, str]] = Field(default_factory=list)

# For NEW /dashboard_dream_chat
class DashboardDreamChatRequest(BaseModel):
    viewer_user_id: str # The logged-in user initiating this chat
    dream_persona_name: str # The persona name typed in the dashboard
    is_chat_empty: bool # Will typically be true for initiation
    chat_history: List[Dict[str, str]] = Field(default_factory=list) # For ongoing messages

# For /generate_ai (PersonaPulse user bots)
class GenerateAIRequest(BaseModel):
    viewer_id: str
    profile_owner_id: str
    is_chat_empty: bool
    onboarding_mode: bool # True only for the very first call post-onboarding
    chat_history: List[Dict[str, str]] = Field(default_factory=list)

# For /get_sidebar_content
class SidebarRequest(BaseModel):
    viewer_id: str
    profile_owner_id: str

# --- Response Schemas ---

class UserProfileSuggestion(BaseModel):
    user_id: str
    name: str
    pfp_url: Optional[str] = None
    summary: Optional[str] = None

# Common response for /chat and /dashboard_dream_chat
class DreamChatResponse(BaseModel):
    bot_response: str
    bot_pfp: Optional[str] = ""

class GenerateAIResponse(BaseModel): # For /generate_ai
    bot_response: str

class SidebarResponse(BaseModel): # For /get_sidebar_content
    sidebar_content: str


# --- Endpoints ---

# Endpoint for ONBOARDING Dream Conversation (uses original kickstart_chatbot)
@app.post("/chat", response_model=DreamChatResponse)
async def onboarding_dream_chat_endpoint(payload: OnboardingDreamChatRequest):
    try:
        # This calls your original kickstart_chatbot, which expects user_id
        # to refer to an existing dream_conversations record.
        result = kickstart_chatbot(
            user_id=payload.user_id,
            is_chat_empty=payload.is_chat_empty,
            chat_history=payload.chat_history
        )
        return result
    except Exception as e:
        print(f"Error in /chat (onboarding dream) endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW Endpoint for DASHBOARD initiated Dream Persona Chat
@app.post("/dashboard_dream_chat", response_model=DreamChatResponse)
async def dashboard_dream_chat_endpoint(payload: DashboardDreamChatRequest):
    try:
        result = start_dashboard_dream_chat(
            viewer_user_id=payload.viewer_user_id,
            dream_persona_name=payload.dream_persona_name,
            is_chat_empty=payload.is_chat_empty,
            chat_history=payload.chat_history
        )
        return result
    except Exception as e:
        print(f"Error in /dashboard_dream_chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint for PersonaPulse User Bots
@app.post("/generate_ai", response_model=GenerateAIResponse)
async def generate_ai_endpoint(payload: GenerateAIRequest):
    try:
        result = invoke_user_chatbot(
            viewer_id=payload.viewer_id,
            profile_owner_id=payload.profile_owner_id,
            is_chat_empty=payload.is_chat_empty,
            onboarding_mode=payload.onboarding_mode,
            chat_history=payload.chat_history
        )
        return result # This function in logic.py now only returns {"bot_response": ...}
    except Exception as e:
        print(f"Error in /generate_ai endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint for Sidebar of PersonaPulse User Bots
@app.post("/get_sidebar_content", response_model=SidebarResponse)
async def get_sidebar_content_endpoint(payload: SidebarRequest):
    try:
        sidebar_text = generate_sidebar_content_logic(
            viewer_id=payload.viewer_id,
            profile_owner_id=payload.profile_owner_id
        )
        return {"sidebar_content": sidebar_text}
    except Exception as e:
        print(f"Error in /get_sidebar_content endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint for User Search
@app.get("/search_users", response_model=List[UserProfileSuggestion])
async def search_users_endpoint(name_query: str = Query(..., min_length=1, max_length=50)): # Allow min_length=1
    try:
        results = search_persona_profiles_logic(name_query)
        return results
    except Exception as e:
        print(f"Error in /search_users endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "PersonaPulse Backend (Revised) is running!"}