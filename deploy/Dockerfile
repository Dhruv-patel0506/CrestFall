# Crestfall engine - one image, frontend and API together.
#
# The 49 company CSVs are deliberately NOT baked in: they are 2 GB, which no
# free container tier will carry, and the app resolves its data directory at
# startup. Mount them at runtime instead:
#
#   docker run -p 8000:8000 -v D:/Rocast/scenario_intelligence_engine/new_data:/data/new_data:ro crestfall
#
# Without the mount the image still works: the panel opens on the import screen
# and any company CSV added through the UI is analysed normally.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CRESTFALL_DATA_DIR=/app/data \
    CRESTFALL_NEW_DATA_DIR=/data/new_data

WORKDIR /app

# requirements.txt is fastapi, uvicorn and pydantic only - verified against the
# imports actually used at run time. No pandas, no numpy.
COPY scenario_intelligence_engine/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY scenario_intelligence_engine/main.py ./
COPY scenario_intelligence_engine/algorithm ./algorithm
COPY scenario_intelligence_engine/data ./data
COPY scenario_intelligence_engine/frontend/dist ./frontend/dist

# Uploads are written by the app, so the directory has to exist and be writable.
RUN mkdir -p /app/data/uploads /data/new_data

EXPOSE 8000

# One worker per container keeps the 2 GB dataset out of duplicated memory; the
# heavy endpoints are CPU bound, so scale by running more containers, not more
# workers, when a host allows it.
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
