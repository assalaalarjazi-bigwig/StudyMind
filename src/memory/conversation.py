"""
Multi-Layered Conversation Memory Engine.
Manages:
1. Recent conversation sliding context (last 6 turns)
2. Rolling summary generation for long study sessions
3. Semantic retrieval of older relevant conversation turns
"""

from typing import Any, Dict, List, Optional
from src.ai.client import gemini_client
from src.database.repository import Repository
from src.utils.config import config

class ConversationMemory:
    @staticmethod
    def get_context_for_query(
        conversation_id: str,
        current_query: str,
        window_size: int = 6
    ) -> Dict[str, Any]:
        """
        Assembles layered conversation memory:
        - recent_messages: Last N turns
        - rolling_summary: Compressed context of earlier discussion
        - relevant_older_messages: Keyword-relevant messages from earlier turns
        """
        all_messages = Repository.get_messages(conversation_id)
        conv = Repository.get_conversation(conversation_id)
        rolling_summary = conv.get("rolling_summary", "") if conv else ""

        if not all_messages:
            return {
                "recent_messages": [],
                "rolling_summary": rolling_summary,
                "relevant_older_messages": []
            }

        # Sliding window for recent messages
        recent_messages = all_messages[-window_size:]
        older_messages = all_messages[:-window_size]

        # Retrieve relevant older messages based on query terms
        relevant_older = []
        if older_messages:
            query_words = set(current_query.lower().split())
            for msg in older_messages:
                msg_words = set(msg["content"].lower().split())
                if len(query_words.intersection(msg_words)) >= 2:
                    relevant_older.append(msg)
                    if len(relevant_older) >= 3:
                        break

        return {
            "recent_messages": recent_messages,
            "rolling_summary": rolling_summary,
            "relevant_older_messages": relevant_older
        }

    @staticmethod
    def maybe_update_rolling_summary(conversation_id: str) -> None:
        """
        Periodically compresses conversation history once it exceeds 8 messages.
        Updates the conversation's rolling_summary field in SQLite.
        """
        messages = Repository.get_messages(conversation_id)
        if len(messages) < 8 or len(messages) % 6 != 0:
            return

        conv = Repository.get_conversation(conversation_id)
        current_summary = conv.get("rolling_summary", "") if conv else ""

        transcript = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages[-8:]])
        summary_prompt = f"""
Summarize the following study discussion into a concise 3-4 sentence knowledge briefing.
Capture key questions asked, concepts explained, and student confusions.

CURRENT SUMMARY:
{current_summary}

NEW DIALOGUE:
{transcript}

UPDATED COMPACT SUMMARY:
"""
        try:
            new_summary = gemini_client.generate_text(
                prompt=summary_prompt,
                max_output_tokens=300,
                temperature=0.2
            )
            if new_summary.strip():
                Repository.update_rolling_summary(conversation_id, new_summary.strip())
        except Exception:
            pass
