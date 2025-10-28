# backend/dentist_bridge_server.py
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import json
from typing import Optional, List
from datetime import datetime, timedelta

# --- Import the specific, logical tools from your MCP server ---
from dentist_mcp_server import (
    # Vapi Tools
    verify_patient,
    create_patient,
    check_availability,
    book_dentist_appointment,
    get_patient_appointments,
    cancel_booking,
    
    # Dashboard Functions
    get_dashboard_stats,
    get_chart_data,
    get_todays_bookings_details,
    get_monthly_breakdown_chart_data,
    
    # NEW: Auth Functions
    get_user_by_email,
    create_admin_user,
    verify_password
)

app = FastAPI()

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- NEW: Security and JWT Configuration ---
# !!! IMPORTANT: Change this to a random, secret string !!!
SECRET_KEY = "YOUR_VERY_SECRET_KEY_NEEDS_TO_BE_CHANGED"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Token expires in 1 hour

# This tells FastAPI what endpoint to check for the token (the login route)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/token")


# --- (Existing Pydantic Models for Tools) ---
class VerifyPatientPayload(BaseModel):
    phone: str

class CreatePatientPayload(BaseModel):
    full_name: str
    date_of_birth: str
    phone: str
    gender: Optional[str] = None
    address: Optional[str] = None

class CheckAvailabilityPayload(BaseModel):
    appointment_date: str
    patient_id: Optional[int] = None
    appointment_start_time: Optional[str] = None

class BookDentistAppointmentPayload(BaseModel):
    dentist_id: int
    patient_id: int
    appointment_date: str
    appointment_start_time: str
    reason: Optional[str] = None
    
class GetPatientAppointmentsPayload(BaseModel):
    phone: str

class CancelBookingPayload(BaseModel):
    phone: str
    appointment_date: str

# --- (Existing Pydantic Models for Dashboard) ---
class DashboardStats(BaseModel):
    todays_bookings: int
    weekly_bookings: int
    monthly_bookings: int
    pending_jobs: int
    revenue_today: Optional[float] = None
    revenue_month: Optional[float] = None
    avg_turnaround_hr: Optional[float] = None
    cancellations: int

class ChartDataPoint(BaseModel):
    date: str
    bookings: int

class BookingsChartResponse(BaseModel):
    data: List[ChartDataPoint]

class TodaysBookingItem(BaseModel):
    patient_name: str
    dentist_name: str
    date: str
    time: str
    end_time: str 

class TodaysBookingsResponse(BaseModel):
    data: List[TodaysBookingItem]

class MonthlyBreakdownDataPoint(BaseModel):
    month: str
    bookings: int
    cancellations: int

class MonthlyBreakdownResponse(BaseModel):
    data: List[MonthlyBreakdownDataPoint]
    
# --- NEW: Pydantic Models for Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str

class UserInDB(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    # Note: We intentionally OMIT the password_hash


# --- NEW: Auth Utility Functions ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    """
    FastAPI Dependency to get the current user from a token.
    This function is a "lock" that protects endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
        
    # Return the user as a Pydantic model (which strips the password hash)
    return UserInDB(**user)


# --- (Keep all your existing /tools/... endpoints) ---
# These endpoints are for Vapi and should remain public (no auth).
@app.post("/tools/verify-patient")
async def handle_verify_patient(request: Request):
    # ... (function contents are unchanged) ...
    try:
        arguments = await request.json()
        print("\n--- [verify_patient] ---")
        print(f"✅ 1. RAW VAPI PAYLOAD RECEIVED:\n{json.dumps(arguments, indent=2)}")
        payload = VerifyPatientPayload(**arguments)
        result = verify_patient(phone=payload.phone)
        print(f"✅ 2. FINAL RESULT SENT TO VAPI:\n{result}\n--------------------------\n")
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        error_detail = f"Error processing verify_patient: {str(e)}"
        print(f"❌ {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/tools/create-patient")
async def handle_create_patient(request: Request):
    # ... (function contents are unchanged) ...
    try:
        arguments = await request.json()
        print("\n--- [create_patient] ---")
        print(f"✅ 1. RAW VAPI PAYLOAD RECEIVED:\n{json.dumps(arguments, indent=2)}")
        payload = CreatePatientPayload(**arguments)
        result = create_patient(
            full_name=payload.full_name,
            date_of_birth=payload.date_of_birth,
            phone=payload.phone,
            gender=payload.gender,
            address=payload.address
        )
        print(f"✅ 2. FINAL RESULT SENT TO VAPI:\n{result}\n--------------------------\n")
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        error_detail = f"Error processing create_patient: {str(e)}"
        print(f"❌ {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/tools/check-availability")
async def handle_check_availability(request: Request):
    # ... (function contents are unchanged) ...
    try:
        arguments = await request.json()
        print("\n--- [check_availability] ---")
        print(f"✅ 1. RAW VAPI PAYLOAD RECEIVED:\n{json.dumps(arguments, indent=2)}")
        payload = CheckAvailabilityPayload(**arguments)
        result = check_availability(
            appointment_date=payload.appointment_date,
            patient_id=payload.patient_id,
            appointment_start_time=payload.appointment_start_time
        )
        print(f"✅ 2. FINAL RESULT SENT TO VAPI:\n{result}\n-----------------------------\n")
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        error_detail = f"Error processing check_availability: {str(e)}"
        print(f"❌ {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/tools/book-dentist-appointment")
async def handle_book_dentist_appointment(request: Request):
    # ... (function contents are unchanged) ...
    try:
        arguments = await request.json()
        print("\n--- [book_dentist_appointment] ---")
        print(f"✅ 1. RAW VAPI PAYLOAD RECEIVED:\n{json.dumps(arguments, indent=2)}")
        payload = BookDentistAppointmentPayload(**arguments)
        result = book_dentist_appointment(
            dentist_id=payload.dentist_id,
            patient_id=payload.patient_id,
            appointment_date=payload.appointment_date,
            appointment_start_time=payload.appointment_start_time,
            reason=payload.reason
        )
        print(f"✅ 2. FINAL RESULT SENT TO VAPI:\n{result}\n-----------------------------------\n")
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        error_detail = f"Error processing book_dentist_appointment: {str(e)}"
        print(f"❌ {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)
    
@app.post("/tools/get-patient-appointments")
async def handle_get_patient_appointments(request: Request):
    # ... (function contents are unchanged) ...
    try:
        arguments = await request.json()
        print("\n--- [get_patient_appointments] ---")
        print(f"✅ 1. RAW VAPI PAYLOAD RECEIVED:\n{json.dumps(arguments, indent=2)}")
        payload = GetPatientAppointmentsPayload(**arguments)
        result = get_patient_appointments(phone=payload.phone)
        print(f"✅ 2. FINAL RESULT SENT TO VAPI:\n{result}\n-----------------------------------\n")
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        error_detail = f"Error processing get_patient_appointments: {str(e)}"
        print(f"❌ {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/tools/cancel-booking")
async def handle_cancel_booking(request: Request):
    # ... (function contents are unchanged) ...
    try:
        arguments = await request.json()
        print("\n--- [cancel_booking] ---")
        print(f"✅ 1. RAW VAPI PAYLOAD RECEIVED:\n{json.dumps(arguments, indent=2)}")
        payload = CancelBookingPayload(**arguments)
        result = cancel_booking(
            phone=payload.phone,
            appointment_date=payload.appointment_date
        )
        print(f"✅ 2. FINAL RESULT SENT TO VAPI:\n{result}\n---------------------------\n")
        return JSONResponse(content=result, status_code=200)
    except Exception as e:
        error_detail = f"Error processing cancel_booking: {str(e)}"
        print(f"❌ {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)


# --- NEW: Admin Auth Endpoints ---

@app.post("/admin/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint. Takes email (as 'username') and password.
    Returns a JWT access token.
    """
    # 1. Find the user in the database
    user = get_user_by_email(form_data.username) # form_data.username is the email
    
    # 2. Check if user exists and password is correct
    if not user or not verify_password(form_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Create and return the token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['user_email']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/admin/create-user", status_code=status.HTTP_201_CREATED)
async def create_new_user(user: UserCreate):
    """
    Utility endpoint to create the first admin user.
    You can remove this after setting up your first user.
    """
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    result = create_admin_user(email=user.email, plain_password=user.password)
    
    if result.get("status") != "Success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to create user")
        )
        
    return {"status": "Success", "email": user.email, "user_id": result.get("user_id")}


# --- UPDATED: Protected Dashboard API Endpoints ---

@app.get("/admin/stats", response_model=DashboardStats)
async def get_dashboard_stats_endpoint(current_user: UserInDB = Depends(get_current_user)):
    """
    Endpoint for the admin dashboard to fetch KPI stats.
    This is now PROTECTED.
    """
    print(f"Authenticated access for: {current_user.user_email}")
    try:
        stats = get_dashboard_stats() 
        return stats
    except Exception as e:
        print(f"❌ Error in /admin/stats endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/chart-data", response_model=BookingsChartResponse)
async def get_bookings_chart_data_endpoint(current_user: UserInDB = Depends(get_current_user)):
    """
    Endpoint for the admin dashboard to fetch data for the bookings chart.
    This is now PROTECTED.
    """
    try:
        chart_data = get_chart_data()
        return chart_data
    except Exception as e:
        print(f"❌ Error in /admin/chart-data endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/todays-bookings", response_model=TodaysBookingsResponse)
async def get_todays_bookings_endpoint(current_user: UserInDB = Depends(get_current_user)):
    """
    Endpoint for the admin dashboard to fetch a list of today's bookings.
    This is now PROTECTED.
    """
    try:
        bookings_data = get_todays_bookings_details()
        return bookings_data
    except Exception as e:
        print(f"❌ Error in /admin/todays-bookings endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/monthly-breakdown", response_model=MonthlyBreakdownResponse)
async def get_monthly_breakdown_endpoint(current_user: UserInDB = Depends(get_current_user)):
    """
    Endpoint for the admin dashboard to fetch data for the monthly breakdown chart.
    This is now PROTECTED.
    """
    try:
        chart_data = get_monthly_breakdown_chart_data()
        return chart_data
    except Exception as e:
        print(f"❌ Error in /admin/monthly-breakdown endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Root endpoint for health check ---
@app.get("/")
def read_root():
    return {"message": "Vapi Bridge Server for Dentist Appointments MCP is running!"}

# --- To run the server ---
if __name__ == "__main__":
    print("🚀 Starting Dentist Vapi Bridge Server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)