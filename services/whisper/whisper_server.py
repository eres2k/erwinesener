#!/usr/bin/env python3
"""
Faster-Whisper STT microservice for Tricorder.
OpenAI-compatible /v1/audio/transcriptions endpoint.

Usage:
    pip install -r requirements.txt
    python whisper_server.py [--port 8080] [--model base] [--device auto]

Models: tiny, base, small, medium, large-v3 (larger = more accurate, slower)
"""

import argparse
import io
import logging
import time

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uvicorn

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("whisper-server")

app = FastAPI(title="Tricorder Whisper STT")

_model = None
_model_name = None


def get_model(model_name: str, device: str):
    global _model, _model_name
    if _model is None or _model_name != model_name:
        from faster_whisper import WhisperModel
        log.info(f"Loading model '{model_name}' on device '{device}'...")
        start = time.time()
        compute_type = "float16" if device == "cuda" else "int8"
        _model = WhisperModel(model_name, device=device, compute_type=compute_type)
        _model_name = model_name
        log.info(f"Model loaded in {time.time() - start:.1f}s")
    return _model


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form("whisper-1"),
    language: str = Form(None),
    response_format: str = Form("json"),
):
    start = time.time()
    audio_bytes = await file.read()
    log.info(f"Received {len(audio_bytes)} bytes, language={language}")

    whisper = get_model(app.state.model_name, app.state.device)

    segments, info = whisper.transcribe(
        io.BytesIO(audio_bytes),
        language=language if language else None,
        beam_size=5,
        vad_filter=True,
    )

    text = " ".join(seg.text.strip() for seg in segments)
    elapsed = time.time() - start
    log.info(f"Transcribed in {elapsed:.1f}s: \"{text[:100]}{'...' if len(text) > 100 else ''}\"")

    return JSONResponse({"text": text})


@app.get("/v1/audio/transcriptions")
async def health():
    return {"status": "ok", "model": app.state.model_name}


@app.get("/")
async def root():
    return {"service": "whisper-stt", "model": app.state.model_name}


def main():
    parser = argparse.ArgumentParser(description="Tricorder Whisper STT Server")
    parser.add_argument("--port", type=int, default=8080, help="Port (default: 8080)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host (default: 0.0.0.0)")
    parser.add_argument("--model", type=str, default="base", help="Whisper model: tiny, base, small, medium, large-v3")
    parser.add_argument("--device", type=str, default="auto", help="Device: auto, cpu, cuda")
    args = parser.parse_args()

    app.state.model_name = args.model
    app.state.device = args.device

    log.info(f"Starting Whisper STT on {args.host}:{args.port} (model={args.model}, device={args.device})")

    # Pre-load model at startup
    get_model(args.model, args.device)

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
