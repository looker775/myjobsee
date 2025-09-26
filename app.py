from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import squareup
from squareup.models import CreatePaymentRequest, Money
from squareup.api_helper import ApiHelper
import time
import os
import uuid
import random
from dotenv import load_dotenv
import threading
from datetime import datetime, timedelta
import requests
import json

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///jobsee.db'
db = SQLAlchemy(app)

# Square Configuration
SQUARE_ACCESS_TOKEN = os.getenv('SQUARE_ACCESS_TOKEN', 'your_sandbox_access_token')
SQUARE_LOCATION_ID = os.getenv('SQUARE_LOCATION_ID', 'your_sandbox_location_id')
SQUARE_APPLICATION_ID = os.getenv('SQUARE_APPLICATION_ID', 'your_app_id')

# Initialize Square Client
from squareup.configuration import Configuration
from squareup.square_client import SquareClient

configuration = Configuration(
    access_token=SQUARE_ACCESS_TOKEN,
    environment='sandbox'  # Change to 'production' for live
)
square_client = SquareClient(configuration)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    full_name = db.Column(db.String(200))
    square_customer_id = db.Column(db.String(120))
    payment_status = db.Column(db.String(50), default='pending')
    subscription_plan = db.Column(db.String(50), default='basic')  # basic, premium
    resume_text = db.Column(db.Text)
    cover_letter_template = db.Column(db.Text)
    linkedin_email = db.Column(db.String(120))
    linkedin_password = db.Column(db.String(200))
    target_job_titles = db.Column(db.Text)  # JSON array
    target_locations = db.Column(db.Text)  # JSON array
    salary_expectation = db.Column(db.String(50))
    experience_level = db.Column(db.String(50))
    job_application_limit = db.Column(db.Integer, default=0)
    jobs_applied_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    last_job_search = db.Column(db.DateTime)

class JobApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    job_title = db.Column(db.String(200))
    company = db.Column(db.String(200))
    platform = db.Column(db.String(100))  # LinkedIn, Indeed, ZipRecruiter, etc.
    job_url = db.Column(db.String(500))
    application_status = db.Column(db.String(50), default='applied')  # applied, failed, pending
    salary_range = db.Column(db.String(100))
    location = db.Column(db.String(200))
    job_description_snippet = db.Column(db.Text)
    application_method = db.Column(db.String(100))  # easy_apply, external_site, email
    applied_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    response_received = db.Column(db.Boolean, default=False)
    response_date = db.Column(db.DateTime)

class PaymentHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    square_payment_id = db.Column(db.String(200))
    amount_paid = db.Column(db.Integer)  # in cents
    plan_purchased = db.Column(db.String(50))
    payment_status = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

with app.app_context():
    db.create_all()

# PRICING PLANS
PLANS = {
    'basic': {
        'price': 2999,  # $29.99
        'job_limit': 100,
        'name': 'Basic Plan - 100 Job Applications'
    },
    'premium': {
        'price': 4999,  # $49.99
        'job_limit': 500,
        'name': 'Premium Plan - 500 Job Applications'
    },
    'enterprise': {
        'price': 7999,  # $79.99
        'job_limit': 1000,
        'name': 'Enterprise Plan - 1000 Job Applications'
    }
}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "JobSee service is running"}), 200

@app.route('/api/plans', methods=['GET'])
def get_plans():
    return jsonify({"plans": PLANS}), 200

@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        email = data.get('email')
        phone = data.get('phone')
        full_name = data.get('full_name')
        plan = data.get('plan', 'basic')
        
        if not all([email, phone, full_name]):
            return jsonify({"error": "Email, phone, and full name are required"}), 400
        
        if plan not in PLANS:
            return jsonify({"error": "Invalid plan selected"}), 400
            
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User already exists with this email"}), 400
        
        # Create Square customer
        customers_api = square_client.customers
        create_customer_request = {
            'given_name': full_name.split(' ')[0],
            'family_name': full_name.split(' ')[-1] if ' ' in full_name else '',
            'email_address': email,
            'phone_number': phone
        }
        
        result = customers_api.create_customer(create_customer_request)
        
        if result.is_error():
            return jsonify({"error": "Failed to create customer profile"}), 400
        
        customer_id = result.body['customer']['id']
        
        new_user = User(
            email=email,
            phone=phone,
            full_name=full_name,
            square_customer_id=customer_id,
            subscription_plan=plan,
            job_application_limit=PLANS[plan]['job_limit']
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "message": "Registration successful!",
            "user_id": new_user.id,
            "customer_id": customer_id,
            "plan": plan,
            "job_limit": PLANS[plan]['job_limit'],
            "amount_to_pay": PLANS[plan]['price']
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route('/api/process-payment', methods=['POST'])
def process_payment():
    try:
        data = request.json
        user_id = data.get('user_id')
        source_id = data.get('source_id')  # Card nonce from Square Web SDK
        
        if not all([user_id, source_id]):
            return jsonify({"error": "User ID and payment source required"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        plan = user.subscription_plan
        amount = PLANS[plan]['price']
        
        # Process payment with Square
        payments_api = square_client.payments
        
        payment_request = CreatePaymentRequest(
            source_id=source_id,
            amount_money=Money(
                amount=amount,
                currency='USD'
            ),
            customer_id=user.square_customer_id,
            location_id=SQUARE_LOCATION_ID,
            idempotency_key=str(uuid.uuid4())
        )
        
        result = payments_api.create_payment(payment_request)
        
        if result.is_error():
            error_msg = result.errors[0]['detail'] if result.errors else "Payment failed"
            return jsonify({"error": f"Payment failed: {error_msg}"}), 400
        
        payment_id = result.body['payment']['id']
        
        # Update user status
        user.payment_status = 'paid'
        user.is_active = True
        
        # Record payment
        payment_record = PaymentHistory(
            user_id=user_id,
            square_payment_id=payment_id,
            amount_paid=amount,
            plan_purchased=plan,
            payment_status='completed'
        )
        
        db.session.add(payment_record)
        db.session.commit()
        
        return jsonify({
            "message": "Payment successful! Account activated.",
            "payment_id": payment_id,
            "plan": plan,
            "job_applications_available": user.job_application_limit,
            "status": "active"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Payment processing failed: {str(e)}"}), 500

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    try:
        data = request.json
        user_id = data.get('user_id')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if not user.is_active:
            return jsonify({"error": "Account not active. Please complete payment."}), 403
        
        user.resume_text = data.get('resume_text', user.resume_text)
        user.cover_letter_template = data.get('cover_letter_template', user.cover_letter_template)
        user.linkedin_email = data.get('linkedin_email', user.linkedin_email)
        user.linkedin_password = data.get('linkedin_password', user.linkedin_password)
        user.target_job_titles = json.dumps(data.get('target_job_titles', []))
        user.target_locations = json.dumps(data.get('target_locations', []))
        user.salary_expectation = data.get('salary_expectation', user.salary_expectation)
        user.experience_level = data.get('experience_level', user.experience_level)
        
        db.session.commit()
        
        return jsonify({"message": "Profile updated successfully!"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Profile update failed: {str(e)}"}), 500

def setup_driver():
    """Setup Chrome driver with optimal settings for job applications"""
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

def apply_to_linkedin_jobs(user, target_titles, target_locations, max_applications=50):
    """Apply to LinkedIn jobs with Easy Apply"""
    applications = []
    driver = setup_driver()
    
    try:
        # Login to LinkedIn
        driver.get("https://www.linkedin.com/login")
        time.sleep(2)
        
        email_input = driver.find_element(By.ID, "username")
        password_input = driver.find_element(By.ID, "password")
        
        email_input.send_keys(user.linkedin_email)
        password_input.send_keys(user.linkedin_password)
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        login_btn.click()
        time.sleep(5)
        
        applied_count = 0
        
        for title in target_titles[:3]:  # Limit to 3 job titles
            for location in target_locations[:2]:  # Limit to 2 locations
                
                if applied_count >= max_applications:
                    break
                    
                # Search for jobs
                search_url = f"https://www.linkedin.com/jobs/search/?keywords={title.replace(' ', '%20')}&location={location.replace(' ', '%20')}&f_LF=f_AL"  # Easy Apply filter
                driver.get(search_url)
                time.sleep(3)
                
                # Get job cards
                job_cards = driver.find_elements(By.CSS_SELECTOR, ".job-search-card")
                
                for card in job_cards[:10]:  # Apply to first 10 jobs per search
                    if applied_count >= max_applications:
                        break
                        
                    try:
                        # Click on job card
                        card.click()
                        time.sleep(2)
                        
                        # Extract job details
                        job_title_elem = driver.find_element(By.CSS_SELECTOR, ".job-details-jobs-unified-top-card__job-title")
                        company_elem = driver.find_element(By.CSS_SELECTOR, ".job-details-jobs-unified-top-card__company-name")
                        
                        job_title = job_title_elem.text
                        company = company_elem.text
                        job_url = driver.current_url
                        
                        # Look for Easy Apply button
                        easy_apply_buttons = driver.find_elements(By.XPATH, "//button[contains(@aria-label, 'Easy Apply')]")
                        
                        if easy_apply_buttons:
                            easy_apply_buttons[0].click()
                            time.sleep(2)
                            
                            # Handle multi-step application
                            max_steps = 5
                            step_count = 0
                            
                            while step_count < max_steps:
                                try:
                                    # Look for Next button
                                    next_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Next')]")
                                    if next_buttons:
                                        next_buttons[0].click()
                                        time.sleep(2)
                                        step_count += 1
                                        continue
                                    
                                    # Look for Review button
                                    review_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Review')]")
                                    if review_buttons:
                                        review_buttons[0].click()
                                        time.sleep(2)
                                        step_count += 1
                                        continue
                                    
                                    # Look for Submit application button
                                    submit_buttons = driver.find_elements(By.XPATH, "//button[contains(@aria-label, 'Submit application')]")
                                    if submit_buttons:
                                        submit_buttons[0].click()
                                        time.sleep(3)
                                        
                                        # Record successful application
                                        application = JobApplication(
                                            user_id=user.id,
                                            job_title=job_title,
                                            company=company,
                                            platform='LinkedIn',
                                            job_url=job_url,
                                            application_status='applied',
                                            location=location,
                                            application_method='easy_apply'
                                        )
                                        
                                        db.session.add(application)
                                        applications.append({
                                            'title': job_title,
                                            'company': company,
                                            'platform': 'LinkedIn',
                                            'status': 'applied'
                                        })
                                        
                                        applied_count += 1
                                        break
                                        
                                    break  # No more buttons found
                                    
                                except Exception as e:
                                    print(f"Error in application step: {str(e)}")
                                    break
                        
                        time.sleep(random.uniform(3, 7))  # Random delay between applications
                        
                    except Exception as e:
                        print(f"Error applying to job: {str(e)}")
                        continue
                        
                if applied_count >= max_applications:
                    break
            
            if applied_count >= max_applications:
                break
                
    except Exception as e:
        print(f"LinkedIn application error: {str(e)}")
    
    finally:
        driver.quit()
        
    return applications

def apply_to_indeed_jobs(user, target_titles, target_locations, max_applications=50):
    """Apply to Indeed jobs"""
    applications = []
    driver = setup_driver()
    
    try:
        applied_count = 0
        
        for title in target_titles[:3]:
            for location in target_locations[:2]:
                
                if applied_count >= max_applications:
                    break
                
                # Search Indeed
                search_url = f"https://www.indeed.com/jobs?q={title.replace(' ', '+')}&l={location.replace(' ', '+')}"
                driver.get(search_url)
                time.sleep(3)
                
                job_links = driver.find_elements(By.CSS_SELECTOR, "h2.jobTitle a")
                
                for link in job_links[:15]:  # Check first 15 jobs
                    if applied_count >= max_applications:
                        break
                        
                    try:
                        job_url = link.get_attribute('href')
                        link.click()
                        time.sleep(2)
                        
                        # Extract job details
                        try:
                            job_title = driver.find_element(By.CSS_SELECTOR, "h1.jobsearch-JobInfoHeader-title").text
                            company = driver.find_element(By.CSS_SELECTOR, "[data-testid='inlineHeader-companyName']").text
                        except:
                            continue
                        
                        # Look for apply buttons
                        apply_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Apply') or contains(@aria-label, 'Apply')]")
                        
                        if apply_buttons:
                            apply_buttons[0].click()
                            time.sleep(2)
                            
                            # Record application
                            application = JobApplication(
                                user_id=user.id,
                                job_title=job_title,
                                company=company,
                                platform='Indeed',
                                job_url=job_url,
                                application_status='applied',
                                location=location,
                                application_method='direct_apply'
                            )
                            
                            db.session.add(application)
                            applications.append({
                                'title': job_title,
                                'company': company,
                                'platform': 'Indeed',
                                'status': 'applied'
                            })
                            
                            applied_count += 1
                        
                        time.sleep(random.uniform(2, 5))
                        driver.back()
                        time.sleep(2)
                        
                    except Exception as e:
                        print(f"Error applying to Indeed job: {str(e)}")
                        continue
                        
                if applied_count >= max_applications:
                    break
            
            if applied_count >= max_applications:
                break
                
    except Exception as e:
        print(f"Indeed application error: {str(e)}")
    
    finally:
        driver.quit()
        
    return applications

@app.route('/api/start-job-applications', methods=['POST'])
def start_job_applications():
    try:
        data = request.json
        user_id = data.get('user_id')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if not user.is_active:
            return jsonify({"error": "Account not active. Please complete payment."}), 403
            
        if user.jobs_applied_count >= user.job_application_limit:
            return jsonify({"error": "Job application limit reached. Please upgrade your plan."}), 403
        
        if not all([user.linkedin_email, user.linkedin_password]):
            return jsonify({"error": "LinkedIn credentials required for job applications"}), 400
        
        target_titles = json.loads(user.target_job_titles or '[]')
        target_locations = json.loads(user.target_locations or '[]')
        
        if not target_titles:
            return jsonify({"error": "Please specify target job titles"}), 400
            
        if not target_locations:
            target_locations = ['Remote']
        
        remaining_applications = user.job_application_limit - user.jobs_applied_count
        
        # Start job applications in background thread
        def run_applications():
            try:
                all_applications = []
                
                # Apply to LinkedIn (60% of applications)
                linkedin_limit = min(int(remaining_applications * 0.6), 300)
                linkedin_apps = apply_to_linkedin_jobs(user, target_titles, target_locations, linkedin_limit)
                all_applications.extend(linkedin_apps)
                
                # Apply to Indeed (40% of applications) 
                indeed_limit = min(remaining_applications - len(linkedin_apps), 200)
                indeed_apps = apply_to_indeed_jobs(user, target_titles, target_locations, indeed_limit)
                all_applications.extend(indeed_apps)
                
                # Update user's applied count
                user.jobs_applied_count += len(all_applications)
                user.last_job_search = datetime.utcnow()
                db.session.commit()
                
                print(f"Completed {len(all_applications)} job applications for user {user_id}")
                
            except Exception as e:
                print(f"Background job application error: {str(e)}")
        
        # Start background thread
        thread = threading.Thread(target=run_applications)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "message": "Job application process started! This will run in the background.",
            "target_applications": remaining_applications,
            "estimated_time": f"{remaining_applications // 10} - {remaining_applications // 5} minutes",
            "target_titles": target_titles,
            "target_locations": target_locations
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to start job applications: {str(e)}"}), 500

@app.route('/api/user/<int:user_id>/applications', methods=['GET'])
def get_user_applications(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    applications = JobApplication.query.filter_by(user_id=user_id).order_by(JobApplication.applied_at.desc()).all()
    
    apps_data = []
    for app in applications:
        apps_data.append({
            "id": app.id,
            "job_title": app.job_title,
            "company": app.company,
            "platform": app.platform,
            "status": app.application_status,
            "location": app.location,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "job_url": app.job_url
        })
    
    return jsonify({
        "user_email": user.email,
        "total_applications": len(apps_data),
        "applications_remaining": user.job_application_limit - user.jobs_applied_count,
        "plan": user.subscription_plan,
        "applications": apps_data
    }), 200

@app.route('/api/user/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    total_apps = JobApplication.query.filter_by(user_id=user_id).count()
    successful_apps = JobApplication.query.filter_by(user_id=user_id, application_status='applied').count()
    
    platform_stats = db.session.query(
        JobApplication.platform,
        db.func.count(JobApplication.id).label('count')
    ).filter_by(user_id=user_id).group_by(JobApplication.platform).all()
    
    return jsonify({
        "user_info": {
            "email": user.email,
            "plan": user.subscription_plan,
            "status": user.payment_status
        },
        "application_stats": {
            "total_applications": total_apps,
            "successful_applications": successful_apps,
            "applications_remaining": user.job_application_limit - user.jobs_applied_count,
            "application_limit": user.job_application_limit
        },
        "platform_breakdown": [{"platform": stat[0], "count": stat[1]} for stat in platform_stats],
        "last_job_search": user.last_job_search.isoformat() if user.last_job_search else None
    }), 200

if __name__ == '__main__':
    print("🚀 Starting JobSee - Professional Job Application Service...")
    print("📊 Features enabled:")
    print("   ✅ Square Payment Processing")
    print("   ✅ LinkedIn Easy Apply Automation")
    print("   ✅ Indeed Job Applications")
    print("   ✅ Multi-platform Job Search")
    print("   ✅ Real-time Application Tracking")
    print("📍 API Endpoints:")
    print("   POST /api/register - User registration")
    print("   POST /api/process-payment - Square payment processing")
    print("   POST /api/update-profile - Update user profile & LinkedIn credentials")
    print("   POST /api/start-job-applications - Start automated applications")
    print("   GET /api/user/{id}/applications - Get application history")
    print("   GET /api/user/{id}/stats - Get user statistics")
    print("   GET /api/plans - Get available plans")
    print("🔧 Make sure to set your environment variables:")
    print("   - SQUARE_ACCESS_TOKEN")
    print("   - SQUARE_LOCATION_ID")
    print("   - SQUARE_APPLICATION_ID")
    app.run(debug=True, port=5000, host='0.0.0.0')