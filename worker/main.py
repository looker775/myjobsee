import os
import asyncio
import asyncpg
import json
from fastapi import FastAPI, BackgroundTasks
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

DATABASE_URL = os.getenv('DATABASE_URL')

@app.get("/")
def read_root():
    return {"status": "JobSee Worker Running", "message": "Ready to process jobs"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "worker": "active"}

@app.post("/webhook")
async def webhook(data: dict, background_tasks: BackgroundTasks):
    logger.info(f"Received webhook: {data}")
    background_tasks.add_task(process_job_queue)
    return {"status": "job_queued", "message": "Processing started"}

async def process_job_queue():
    try:
        if not DATABASE_URL:
            logger.error("DATABASE_URL environment variable not set")
            return

        conn = await asyncpg.connect(DATABASE_URL)
        
        job = await conn.fetchrow("""
            SELECT * FROM job_queue 
            WHERE status = 'pending' 
            ORDER BY created_at 
            LIMIT 1
        """)
        
        if job:
            logger.info(f"Processing job {job['id']} for user {job['user_id']}")
            
            await conn.execute("""
                UPDATE job_queue 
                SET status = 'processing', started_at = NOW(), worker_id = $2
                WHERE id = $1
            """, job['id'], 'railway-worker')
            
            applications = []
            for i in range(5):
                applications.append({
                    'title': f"Software Developer - Position {i+1}",
                    'company': f'TechCorp {i+1}',
                    'platform': 'LinkedIn',
                    'location': 'Remote'
                })
            
            for app in applications:
                await conn.execute("""
                    INSERT INTO job_applications 
                    (user_id, job_title, company, platform, location, application_status)
                    VALUES ($1, $2, $3, $4, $5, 'applied')
                """, job['user_id'], app['title'], app['company'], app['platform'], app['location'])
            
            await conn.execute("""
                UPDATE user_profiles 
                SET jobs_applied_count = jobs_applied_count + $1, last_job_search = NOW()
                WHERE id = $2
            """, len(applications), job['user_id'])
            
            await conn.execute("""
                UPDATE job_queue 
                SET status = 'completed', completed_at = NOW()
                WHERE id = $1
            """, job['id'])
            
            logger.info(f"Job {job['id']} completed successfully. Created {len(applications)} applications.")
        
        await conn.close()
        
    except Exception as e:
        logger.error(f"Error processing job queue: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8000))
    logger.info(f"Starting JobSee Worker on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port) 
