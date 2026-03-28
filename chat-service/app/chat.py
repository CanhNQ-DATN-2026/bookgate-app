import json
import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from openai import AsyncOpenAI

from .config import settings
from .auth import get_current_user_id

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


def _build_system_prompt(books: list) -> str:
    lines = []
    for b in books:
        line = f'- "{b["title"]}" by {b["author"]}'
        if b.get("category"):
            line += f' | {b["category"]}'
        if b.get("published_year"):
            line += f' | {b["published_year"]}'
        line += " | [có file]" if b.get("has_file") else " | [chưa có file]"
        if b.get("description"):
            snippet = b["description"][:120].rstrip()
            line += f"\n  {snippet}{'...' if len(b['description']) > 120 else ''}"
        lines.append(line)

    book_list = "\n".join(lines) if lines else "(Thư viện chưa có sách nào)"

    return f"""Bạn là trợ lý thư viện của Bookgate — một nền tảng thư viện số.
Nhiệm vụ của bạn là giúp người dùng tìm sách, trả lời câu hỏi về bộ sưu tập và tóm tắt sách dựa trên kiến thức của bạn.

DANH SÁCH SÁCH TRONG THƯ VIỆN ({len(books)} cuốn):
{book_list}

HƯỚNG DẪN:
- Trả lời bằng ngôn ngữ người dùng dùng (tiếng Việt hoặc tiếng Anh)
- "[có file]" = sách đã có file, có thể request download; "[chưa có file]" = chỉ có metadata
- Khi tóm tắt sách nổi tiếng, dùng kiến thức của bạn
- Nếu sách không có trong danh sách, nói rõ là thư viện chưa có
- Gợi ý sách liên quan từ danh sách trên khi được hỏi
- Giữ câu trả lời ngắn gọn, hữu ích

GIỚI HẠN QUAN TRỌNG — TUYỆT ĐỐI KHÔNG làm các việc sau:
- KHÔNG gửi email, KHÔNG hứa sẽ gửi email, KHÔNG hỏi địa chỉ email của người dùng
- KHÔNG cung cấp link tải xuống, KHÔNG tạo download link
- KHÔNG thực hiện bất kỳ hành động nào ngoài việc trả lời câu hỏi bằng văn bản
- Nếu người dùng muốn tải sách: hướng dẫn họ vào trang chi tiết sách trên Bookgate và nhấn "Request Download" để gửi yêu cầu cho admin duyệt
- Nếu người dùng cung cấp email hoặc thông tin cá nhân: KHÔNG lưu, KHÔNG sử dụng, giải thích rằng bạn không có khả năng gửi email
"""


async def _fetch_books(token: str) -> list:
    """Fetch book catalog from api-service, forwarding the user's Bearer token."""
    url = f"{settings.API_SERVICE_URL}/api/v1/books"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                url,
                params={"limit": 500},
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            data = resp.json()
            # api-service may return a list or a paginated dict {"items": [...]}
            if isinstance(data, list):
                return data
            return data.get("items", data.get("books", []))
    except Exception as e:
        print(f"[chat] failed to fetch books from api-service: {e!r}")
        return []


@router.post("")
async def chat(
    payload: ChatRequest,
    user: dict = Depends(get_current_user_id),
):
    if not settings.OPENAI_API_KEY:
        async def no_key():
            yield 'data: {"content": "⚠ OpenAI API key chưa được cấu hình."}\n\n'
            yield "data: [DONE]\n\n"
        return StreamingResponse(no_key(), media_type="text/event-stream")

    books = await _fetch_books(user["token"])
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    messages = [{"role": "system", "content": _build_system_prompt(books)}]
    for h in payload.history[-12:]:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": payload.message})

    print(f"[chat] user_id={user['user_id']} books={len(books)} msg={payload.message[:60]!r}")

    stream = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
        max_tokens=800,
        temperature=0.7,
    )

    async def generate():
        try:
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield f"data: {json.dumps({'content': delta.content})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"[chat] stream error: {e!r}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
