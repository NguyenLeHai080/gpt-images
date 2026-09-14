import os
import sys
import uvicorn

if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass
    port = int(os.getenv("PORT", "8000"))
    print(f"🚀 Khởi động MintForge Backend API tại http://127.0.0.1:{port} ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True)


