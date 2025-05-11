from bing_image_urls import bing_image_urls
import google.generativeai as genai
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import trafilatura
import requests
from typing import Optional, List, Dict, Any 
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from googlesearch import search
from suits import Donna
from prompts import (
    get_system_prompt, initiate_snippet, ongoing_snippet,
    persist_user_sysprompt, get_user_specific_sysprompt,
    greet_user_snipppet, history_snippet, coalesce_prompts,
    icebreaker, keep_yapping, sidebar as sidebar_prompt_snippet,
    post_onboarding_dream_snippet
)
import time

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not GOOGLE_API_KEY: raise ValueError("GOOGLE_API_KEY missing")
if not SUPABASE_URL or not SUPABASE_ANON_KEY: raise ValueError("Supabase config missing")

genai.configure(api_key=GOOGLE_API_KEY)

celeb_model_preferred = genai.GenerativeModel(model_name="gemini-1.5-pro-latest") 
celeb_model_default = genai.GenerativeModel(model_name="gemini-1.5-flash-latest") 


supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def fetch_user_context(user_id):
    profile_resp = supabase.table('persona_profiles').select('*').eq('user_id', user_id).single().execute()
    profile = profile_resp.data

    convo_resp = supabase.table('dream_conversations').select('*').eq('user_id', user_id).order('started_at', desc=True).limit(1).single().execute()
    conversation = convo_resp.data

    context = {
        "basic_info": {
            "name": profile.get('name'), "dob": profile.get('dob'), "country": profile.get('country'),
            "languages": profile.get('languages', []), "occupation": profile.get('occupation')
        },
        "summary": profile.get('summary'), "interests": profile.get('interests', []),
        "vibe_responses": profile.get('vibe_responses', {}),
        "persona": conversation.get('persona_name'), "reason": conversation.get('reason')
    }
    return context

def get_user_onboarding_data(user_id: str) -> dict:
    profile_resp = supabase.table("persona_profiles").select("*").eq("user_id", user_id).single().execute()
    profile_data = profile_resp.data if profile_resp.data else {}
    chat_resp = supabase.table("chat_history").select("messages").eq("user_id", user_id).order('last_updated', desc=True).limit(1).maybe_single().execute()
    chat_data = chat_resp.data if chat_resp.data else {}

    return {
        "basic_info": {
            "name": profile_data.get("name", "User"), "dob": profile_data.get("dob"),
            "country": profile_data.get("country"), "languages": profile_data.get("languages", []),
            "occupation": profile_data.get("occupation"),
        },
        "summary": profile_data.get("summary", "No summary provided."),
        "interests": profile_data.get("interests", []),
        "vibe_responses": profile_data.get("vibe_responses", {}),
        "chat_messages": chat_data.get("messages", [])
    }

def get_image_links(query): 
    imgls = bing_image_urls(query, limit=4) 
    return imgls[1] if len(imgls) > 1 else (imgls[0] if imgls else None) 

def scrape(url: str) -> Optional[str]: 
    def _scrape():
        try:
            response = requests.get(url, timeout=5) 
            response.raise_for_status()
            content = trafilatura.extract(response.text)
            return content
        except requests.RequestException: return None 
        except Exception: return None
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_scrape)
        try: return future.result(timeout=7) 
        except TimeoutError: return None
        except Exception: return None

def research(query): 
    scraped = []
    num_res = 5 
    search_results = search(query, num_results=10) 
    try:
        while num_res > 0:
            try:
                result = next(search_results)
                if "https://www.youtube.com" not in result:
                    content = scrape(result)
                    if content: scraped.append(content); num_res -= 1
            except StopIteration: break
            except Exception: continue 
    except Exception: pass
    if not scraped: return f"Basic information about {query} is widely known."
    donna = Donna(scraped)
    donna.briefing(api_key=GOOGLE_API_KEY)
    output = donna.i_need_you_to(f"present the given information in a human-readable format, as if you're responding to a query asked by the user. The query is- Who is {query}? What is their personality like? How do they behave or talk?. Be friendly and mildly verbose. DO NOT EXCEED 300 words, and strictly keep your response in 1 paragraph only.")
    return output

def kickstart_chatbot(user_id, is_chat_empty=True, chat_history=[]):
    user_context = fetch_user_context(user_id)
    persona_name = user_context['persona']
    image_link_result = get_image_links(persona_name) 
    research_output = research(persona_name)
    current_dict = { "user_context": user_context, "image_links": image_link_result, "research_output": research_output }
    half_prompt = get_system_prompt(current_dict)
    chat_history_str = str(chat_history) if chat_history else "No previous messages."
    main_prompt = f"{half_prompt}\n{initiate_snippet}" if is_chat_empty else f"{half_prompt}\n{ongoing_snippet}\n{chat_history_str}"
    try: main_output = celeb_model_preferred.generate_content(main_prompt).text
    except Exception: main_output = celeb_model_default.generate_content(main_prompt).text
    return {"bot_response":main_output, "bot_pfp": image_link_result or ""}


def invoke_user_chatbot(viewer_id, profile_owner_id, is_chat_empty=True, onboarding_mode=True, chat_history=[]): # Original structure
    onb_data = get_user_onboarding_data(profile_owner_id)
    chat_history_str = str(chat_history) if chat_history else "No previous messages."
    
    # PHASE 1: Post-onboarding
    if viewer_id == profile_owner_id and onboarding_mode:
        current_sysprompt = get_user_specific_sysprompt(onb_data)
        if is_chat_empty:
            persistent_prompt = persist_user_sysprompt(onb_data)
            supabase.from_("profiles").upsert({"id": profile_owner_id, "onboarding_data": persistent_prompt}, on_conflict="id").execute()
            main_prompt = f"{current_sysprompt}{greet_user_snipppet}"
        else: # Ongoing chat during onboarding (if that's a flow)
            main_prompt = f"{current_sysprompt}{history_snippet}\n{chat_history_str}"
    # PHASE 2: Returning to own bot (not onboarding)
    elif viewer_id == profile_owner_id and not onboarding_mode:
        current_sysprompt = get_user_specific_sysprompt(onb_data)
        main_prompt = f"{current_sysprompt}{greet_user_snipppet}" if is_chat_empty else f"{current_sysprompt}{history_snippet}\n{chat_history_str}"
    # PHASE 3: Viewer chatting with someone else's bot
    elif viewer_id != profile_owner_id:
        owner_sysprompt_for_others = get_user_specific_sysprompt(onb_data) 
        viewer_summary_resp = supabase.table("profiles").select("onboarding_data").eq("id", viewer_id).maybe_single().execute()
        viewer_summary_data = viewer_summary_resp.data.get("onboarding_data", "A new user.") if viewer_summary_resp.data else "A new user."
        
        half_prompt_for_others = coalesce_prompts(vdata=viewer_summary_data, odata=owner_sysprompt_for_others)
        main_prompt = f"{half_prompt_for_others}{icebreaker}" if is_chat_empty else f"{half_prompt_for_others}{keep_yapping}\n{chat_history_str}"
    else: 
        raise ValueError("Unhandled condition in invoke_user_chatbot")

    try: bot_response = celeb_model_preferred.generate_content(main_prompt).text
    except Exception: bot_response = celeb_model_default.generate_content(main_prompt).text
    return {"bot_response": bot_response}
    

def generate_sidebar_content_logic(viewer_id: str, profile_owner_id: str) -> str:
    """Generates sidebar content based on viewer and profile owner."""
    try:
        owner_onboarding_data = get_user_onboarding_data(profile_owner_id)
        owner_system_prompt_context = get_user_specific_sysprompt(owner_onboarding_data)
        viewer_profile_summary_resp = supabase.table("profiles").select("onboarding_data").eq("id", viewer_id).maybe_single().execute()
        viewer_summary_data = viewer_profile_summary_resp.data.get("onboarding_data", "The viewer is new or their details are not available.") if viewer_profile_summary_resp.data else "Details for the viewer are currently unavailable."
        
        combined_prompt_for_sidebar = coalesce_prompts(vdata=viewer_summary_data, odata=owner_system_prompt_context)
        final_sidebar_prompt = f"{combined_prompt_for_sidebar}\n{sidebar_prompt_snippet}"

        sidebar_response = celeb_model_default.generate_content(final_sidebar_prompt) 
        return sidebar_response.text
    except Exception as e:
        print(f"Error generating sidebar content (viewer: {viewer_id}, owner: {profile_owner_id}): {e}")
        return "Hello! I'm the AI persona you're chatting with. Looking forward to our conversation!"


def search_persona_profiles_logic(name_query: str) -> List[Dict[str, Any]]: # NEW
    """Searches persona_profiles by name."""
    if not name_query or len(name_query) < 1:
        return []
    try:
        response = supabase.table("persona_profiles") \
            .select("user_id, name, pfp_url, summary") \
            .ilike("name", f"%{name_query}%") \
            .limit(5) \
            .execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error searching persona profiles for '{name_query}': {e}")
        return []

def start_dashboard_dream_chat(
    viewer_user_id: str, 
    dream_persona_name: str, 
    is_chat_empty: bool = True, 
    chat_history: List[Dict[str, str]] = [] 
):
    viewer_profile_resp = supabase.table('persona_profiles').select('name, summary, interests, dob, country, languages, occupation, vibe_responses').eq('user_id', viewer_user_id).maybe_single().execute()
    viewer_data = viewer_profile_resp.data if viewer_profile_resp.data else {}

    context_for_ai_persona = {
        "basic_info": {
            "name": viewer_data.get('name', "Someone"),
            "dob": viewer_data.get('dob'),
            "country": viewer_data.get('country'),
            "languages": viewer_data.get('languages', []),
            "occupation": viewer_data.get('occupation')
        },
        "summary": viewer_data.get('summary', "A curious individual."),
        "interests": viewer_data.get('interests', []),
        "vibe_responses": viewer_data.get('vibe_responses', {}), 
        "persona": dream_persona_name,
        "reason": "User initiated a chat from the dashboard."
    }

    bot_pfp_url = get_image_links(dream_persona_name)
    researched_info = research(dream_persona_name)

    prompt_construction_dict = {
        "user_context": context_for_ai_persona,
        "research_output": researched_info   
    }
    system_level_prompt = get_system_prompt(prompt_construction_dict)
    
    chat_history_str = str(chat_history) if chat_history else "No previous messages."
    full_llm_prompt = f"{system_level_prompt}\n{post_onboarding_dream_snippet}\n{initiate_snippet}" if is_chat_empty else f"{system_level_prompt}\n{post_onboarding_dream_snippet}\n{ongoing_snippet}\n{chat_history_str}"
    
    try:
        response_text = celeb_model_preferred.generate_content(full_llm_prompt).text
    except Exception: # Fallback to default model
        response_text = celeb_model_default.generate_content(full_llm_prompt).text
            
    return {"bot_response": response_text, "bot_pfp": bot_pfp_url or ""}
