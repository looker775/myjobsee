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

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')

@app.get("/")
def read_root():
    return {"status": "JobSee Worker Running", "version": "1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/process-queue")
async def process_queue():
    """Process pending jobs from the queue"""
    try:
        if not DATABASE_URL:
            return {"error": "DATABASE_URL not configured"}
            
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Get one pending job
        job = await conn.fetchrow("""
            SELECT * FROM job_queue 
            WHERE status = 'pending' 
            ORDER BY created_at 
            LIMIT 1
        """)
        
        if job:
            logger.info(f"Processing job {job['id']}")
            
            # Mark as processing
            await conn.execute("""
                UPDATE job_queue 
                SET status = 'processing', started_at = NOW()
                WHERE id = $1
            """, job['id'])
            
            # Simulate job processing (replace with actual logic later)
            applications = []
            task_data = job['task_data']
            
            # Create mock applications for testing
            for i in range(5):
                applications.append({
                    'title': f"Software Developer {i+1}",
                    'company': f"Tech Company {i+1}",
                    'platform': 'LinkedIn',
                    'location': 'Remote'
                })
            
            # Save applications to database
            for app in applications:
                await conn.execute("""
                    INSERT INTO job_applications 
                    (user_id, job_title, company, platform, location, application_status)
                    VALUES ($1, $2, $3, $4, $5, 'applied')
                """, job['user_id'], app['title'], app['company'], 
                     app['platform'], app['location'])
            
            # Update user application count
            await conn.execute("""
                UPDATE user_profiles 
                SET jobs_applied_count = jobs_applied_count + $1
                WHERE id = $2
            """, len(applications), job['user_id'])
            
            # Mark job as completed
            await conn.execute("""
                UPDATE job_queue 
                SET status = 'completed', completed_at = NOW()
                WHERE id = $1
            """, job['id'])
            
            await conn.close()
            
            return {
                "processed": True, 
                "job_id": str(job['id']),
                "applications_created": len(applications)
            }
        
        await conn.close()
        return {"processed": False, "message": "No pending jobs"}
        
    except Exception as e:
        logger.error(f"Error processing queue: {e}")
        return {"error": str(e)}

# Background task to auto-process queue
async def background_processor():
    while True:
        await asyncio.sleep(60)  # Check every minute
        try:
            await process_queue()
        except Exception as e:
            logger.error(f"Background processor error: {e}")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting JobSee Worker...")
    # Start background processor
    asyncio.create_task(background_processor())

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)