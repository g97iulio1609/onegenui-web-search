"""
Crawl4AI CLI Wrapper - Optimized for parallel high-performance crawling.

Best Practices Applied:
- Undetected browser mode for anti-bot bypass (Cloudflare, Akamai, etc.)
- Magic mode for combined stealth techniques
- True parallel crawling with arun_many() and streaming
- Optimized browser settings (text_mode, light_mode)
- Full media extraction (images, videos, audio)
"""

import asyncio
import sys
import json
import argparse
from typing import List, Dict, Any, Optional
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode


# -----------------------------------------------------------------------------
# JSONL Streaming Helper
# -----------------------------------------------------------------------------


def emit_event(event_type: str, data: Dict[str, Any]):
    """Emit a JSONL event to stdout."""
    message = {"type": event_type, **data}
    print(json.dumps(message), flush=True)


def emit_progress(
    action: str,
    status: str,
    url: str = None,
    target: str = None,
    message: str = None,
):
    """Emit a progress event compatible with BrowserAction schema."""
    data = {
        "action": action,
        "status": status,
        "timestamp": 0,
    }
    if url:
        data["url"] = url
    if target:
        data["target"] = target
    if message:
        data["message"] = message

    emit_event("progress", data)


# -----------------------------------------------------------------------------
# Media Extraction Helpers
# -----------------------------------------------------------------------------


def extract_images(media: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract and normalize image data from Crawl4AI media result."""
    images = media.get("images", [])
    result = []
    for img in images:
        src = img.get("src", "")
        if not src or len(src) < 10:
            continue
        # Skip data URIs and tracking pixels
        if src.startswith("data:") or "1x1" in src or "pixel" in src.lower():
            continue

        result.append(
            {
                "src": src,
                "alt": img.get("alt", ""),
                "title": img.get("title", ""),
                "score": img.get("score"),
                "description": img.get("desc", ""),
                "width": img.get("width"),
                "height": img.get("height"),
            }
        )
    return result


def extract_videos(media: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract and normalize video data from Crawl4AI media result."""
    videos = media.get("videos", [])
    result = []
    for vid in videos:
        src = vid.get("src", "")
        if not src:
            continue

        provider = None
        embed_url = None

        if "youtube.com" in src or "youtu.be" in src:
            provider = "youtube"
            video_id = extract_youtube_id(src)
            if video_id:
                embed_url = f"https://www.youtube.com/embed/{video_id}"
        elif "vimeo.com" in src:
            provider = "vimeo"
            video_id = extract_vimeo_id(src)
            if video_id:
                embed_url = f"https://player.vimeo.com/video/{video_id}"
        elif "dailymotion.com" in src or "dai.ly" in src:
            provider = "dailymotion"
            video_id = extract_dailymotion_id(src)
            if video_id:
                embed_url = f"https://www.dailymotion.com/embed/video/{video_id}"
        elif "twitch.tv" in src:
            provider = "twitch"
        elif "tiktok.com" in src:
            provider = "tiktok"
        elif "twitter.com" in src or "x.com" in src:
            provider = "twitter"

        result.append(
            {
                "src": src,
                "embedUrl": embed_url,
                "provider": provider,
                "title": vid.get("title", ""),
                "description": vid.get("desc", ""),
                "duration": vid.get("duration"),
                "thumbnail": vid.get("poster") or vid.get("thumbnail"),
            }
        )
    return result


def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    import re

    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})",
        r"youtube\.com/v/([a-zA-Z0-9_-]{11})",
        r"youtube\.com/shorts/([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def extract_vimeo_id(url: str) -> Optional[str]:
    """Extract Vimeo video ID from URL."""
    import re

    match = re.search(r"vimeo\.com/(?:video/)?(\d+)", url)
    return match.group(1) if match else None


def extract_dailymotion_id(url: str) -> Optional[str]:
    """Extract Dailymotion video ID from URL."""
    import re

    patterns = [
        r"dailymotion\.com/video/([a-zA-Z0-9]+)",
        r"dai\.ly/([a-zA-Z0-9]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def extract_audio(media: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract and normalize audio data from Crawl4AI media result."""
    audios = media.get("audios", [])
    result = []
    for aud in audios:
        src = aud.get("src", "")
        if not src:
            continue
        result.append(
            {
                "src": src,
                "title": aud.get("title", ""),
                "description": aud.get("desc", ""),
                "duration": aud.get("duration"),
            }
        )
    return result


# -----------------------------------------------------------------------------
# Crawler Logic - Optimized for Performance with Parallel Execution
# -----------------------------------------------------------------------------


async def crawl_urls(
    urls: List[str],
    js_script: str = None,
    wait_for: str = None,
    cache_enabled: bool = True,
    extract_media: bool = True,
):
    """
    Crawl multiple URLs in parallel using Crawl4AI with optimized settings.
    Emits progress events for each URL as they complete.
    """

    # Browser Configuration
    browser_config = BrowserConfig(
        browser_type="chromium",
        headless=True,
        text_mode=not extract_media,
        light_mode=True,
        verbose=False,
        extra_args=[
            "--disable-blink-features=AutomationControlled",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-extensions",
            "--disable-plugins",
            "--disable-infobars",
            "--disable-dev-shm-usage",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-background-networking",
            "--disable-sync",
            "--disable-translate",
            "--metrics-recording-only",
            "--safebrowsing-disable-auto-update",
        ],
    )

    # Crawler Run Configuration
    cache_mode = CacheMode.ENABLED if cache_enabled else CacheMode.BYPASS

    run_config = CrawlerRunConfig(
        cache_mode=cache_mode,
        js_code=js_script,
        wait_for=wait_for,
        magic=True,
        simulate_user=True,
        override_navigator=True,
        word_count_threshold=10,
        wait_until="domcontentloaded",
        page_timeout=60000,
        delay_before_return_html=1.0,
    )

    emit_progress(
        "navigating",
        "loading",
        message=f"Starting parallel crawl for {len(urls)} URLs...",
    )

    total = len(urls)
    final_results = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # Parallel execution using arun_many
        if len(urls) == 1:
            # Single URL - use arun directly
            url = urls[0]
            emit_progress(
                "navigating",
                "loading",
                url=url,
                message=f"[1/{total}] Crawling...",
            )

            try:
                result = await crawler.arun(url=url, config=run_config)
                process_result(result, 1, total, extract_media, final_results)
            except Exception as e:
                emit_progress(
                    "extracting",
                    "error",
                    url=url,
                    message=f"[1/{total}] Exception: {str(e)}",
                )
        else:
            # Multiple URLs - use arun_many for true parallel execution
            for idx, url in enumerate(urls):
                emit_progress(
                    "navigating",
                    "loading",
                    url=url,
                    message=f"[{idx + 1}/{total}] Queued for crawling...",
                )

            try:
                # arun_many returns results - could be list or async generator
                results = await crawler.arun_many(urls=urls, config=run_config)

                # Handle both list and async iterator responses
                if hasattr(results, "__aiter__"):
                    # Async iterator (streaming mode)
                    completed = 0
                    async for result in results:
                        completed += 1
                        process_result(
                            result, completed, total, extract_media, final_results
                        )
                else:
                    # List of results
                    for idx, result in enumerate(results):
                        process_result(
                            result, idx + 1, total, extract_media, final_results
                        )

            except Exception as e:
                emit_progress(
                    "extracting",
                    "error",
                    message=f"Parallel crawl failed: {str(e)}",
                )
                # Fallback to sequential if parallel fails
                for idx, url in enumerate(urls):
                    try:
                        emit_progress(
                            "navigating",
                            "loading",
                            url=url,
                            message=f"[{idx + 1}/{total}] Fallback sequential crawl...",
                        )
                        result = await crawler.arun(url=url, config=run_config)
                        process_result(
                            result, idx + 1, total, extract_media, final_results
                        )
                    except Exception as inner_e:
                        emit_progress(
                            "extracting",
                            "error",
                            url=url,
                            message=f"[{idx + 1}/{total}] {str(inner_e)}",
                        )

    # Emit final result event
    emit_event("result", {"results": final_results})


def process_result(
    result, idx: int, total: int, extract_media: bool, final_results: List[Dict]
):
    """Process a single crawl result and add to final_results."""
    url = result.url if hasattr(result, "url") and result.url else "unknown"

    if result.success:
        emit_progress(
            "extracting",
            "complete",
            url=url,
            message=f"[{idx}/{total}] Extracted successfully",
        )

        # Extract markdown content - PREFER fit_markdown for LLM-friendly output
        markdown_content = ""
        if hasattr(result, "markdown"):
            if isinstance(result.markdown, str):
                markdown_content = result.markdown
            elif (
                hasattr(result.markdown, "fit_markdown")
                and result.markdown.fit_markdown
            ):
                # fit_markdown is optimized for LLM consumption
                markdown_content = result.markdown.fit_markdown
            elif hasattr(result.markdown, "raw_markdown"):
                markdown_content = result.markdown.raw_markdown

        # Safety Truncation: Prevent huge JSONs from clogging stdout buffer
        if len(markdown_content) > 500000:
            markdown_content = (
                markdown_content[:500000] + "\n...[Truncated by Python Crawler]"
            )

        # Build result object
        crl_data = {
            "url": result.url,
            "title": "",
            "content": markdown_content,
            "links": [],
            "metadata": result.metadata if hasattr(result, "metadata") else {},
        }

        # Extract links
        if hasattr(result, "links") and result.links:
            internal_links = result.links.get("internal", [])
            external_links = result.links.get("external", [])
            crl_data["links"] = [
                {"text": l.get("text", ""), "href": l.get("href", "")}
                for l in (internal_links + external_links)[:50]
            ]

        # Extract media if enabled
        if extract_media and hasattr(result, "media") and result.media:
            crl_data["images"] = extract_images(result.media)
            crl_data["videos"] = extract_videos(result.media)
            crl_data["audio"] = extract_audio(result.media)

        final_results.append(crl_data)

    else:
        error_msg = (
            result.error_message
            if hasattr(result, "error_message")
            else "Unknown error"
        )
        emit_progress(
            "extracting",
            "error",
            url=url,
            message=f"[{idx}/{total}] {error_msg}",
        )


# -----------------------------------------------------------------------------
# Main Entrypoint
# -----------------------------------------------------------------------------


async def main():
    parser = argparse.ArgumentParser(
        description="Crawl4AI CLI Wrapper - Optimized for parallel crawling"
    )
    parser.add_argument("--urls", required=True, help="JSON string of URL array")
    parser.add_argument("--js", help="JavaScript code to execute on each page")
    parser.add_argument(
        "--wait-for", dest="wait_for", help="CSS selector to wait for before extraction"
    )
    parser.add_argument(
        "--no-cache", action="store_true", help="Disable caching (force fresh fetch)"
    )
    parser.add_argument(
        "--no-media",
        action="store_true",
        help="Skip media extraction for faster text-only crawling",
    )

    args = parser.parse_args()

    try:
        urls = json.loads(args.urls)
        if isinstance(urls, str):
            urls = [urls]
    except json.JSONDecodeError:
        emit_event("error", {"message": "Invalid URLs JSON"})
        sys.exit(1)

    try:
        await crawl_urls(
            urls=urls,
            js_script=args.js if args.js else None,
            wait_for=args.wait_for,
            cache_enabled=not args.no_cache,
            extract_media=not args.no_media,
        )
    except Exception as e:
        emit_event("error", {"message": str(e)})
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
