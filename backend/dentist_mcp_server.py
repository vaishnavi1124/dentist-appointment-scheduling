# backend/dentist_mcp_server.py
import sys
import mysql.connector
import requests
import json
from datetime import datetime, timedelta, date
import calendar
from passlib.context import CryptContext  # <-- NEW: For password hashing
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
import os
mcp = FastMCP("Dentist-Appointment-MCP")


load_dotenv()  # Load variables from .env

DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'database': os.getenv("DB_NAME")
}
# --- NEW: Password Hashing Setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- NEW: Password Utility Functions ---
# --- NEW: Password Utility Functions ---
def verify_password(plain_password, hashed_password):
    """Verifies a plain password against a hashed one."""
    # bcrypt supports only up to 72 bytes
    plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hashes a plain password (bcrypt limit 72 bytes)."""
    password = password[:72]
    return pwd_context.hash(password)



def _run_query(query: str, params: tuple = None, fetch: str = 'all'):
    """
    Executes a database query using a new connection and a buffered cursor.
    Handles SELECT, INSERT, and UPDATE operations correctly.
    """
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True, buffered=True)
        
        # Normalize the query to check its type
        clean_query = query.strip().upper()
        cursor.execute(query, params or ())
        
        if cursor.description: # This is a SELECT query
            return cursor.fetchall() if fetch == 'all' else cursor.fetchone()
        else: # This is an INSERT, UPDATE, or DELETE query
            conn.commit()
            
            # FIX: Return the correct success metric based on the query type
            if clean_query.startswith("INSERT"):
                return {"status": "Success", "last_id": cursor.lastrowid}
            elif clean_query.startswith("UPDATE") or clean_query.startswith("DELETE"):
                return {"status": "Success", "affected_rows": cursor.rowcount}
            
            # Fallback for other non-SELECT queries
            return {"status": "Success"}
    finally:
        if conn and conn.is_connected():
            conn.close()

# --- NEW: User Management Functions (NOT @mcp.tool) ---
def get_user_by_email(email: str):
    """Fetches a user from the 'users' table by their email."""
    try:
        query = "SELECT * FROM users WHERE user_email = %s"
        return _run_query(query, (email,), fetch='one')
    except Exception as e:
        print(f"  - ❌ Error in get_user_by_email: {e}")
        return None

def create_admin_user(email: str, plain_password: str):
    """Creates a new admin user with a hashed password."""
    try:
        hashed_password = get_password_hash(plain_password)
        
        # Use email as user_name for simplicity, as user_name must be NOT NULL UNIQUE
        query = "INSERT INTO users (user_name, user_email, password_hash) VALUES (%s, %s, %s)"
        params = (email, email, hashed_password)
        
        result = _run_query(query, params)
        
        if result and result.get('status') == "Success":
            return {"status": "Success", "user_id": result.get('last_id')}
        else:
            return {"status": "Failed", "message": "Database error during user creation."}
            
    except mysql.connector.Error as err:
        if err.errno == 1062: # Duplicate entry
             return {"status": "Error", "message": "Email or username already exists."}
        return {"status": "Error", "message": str(err)}
    except Exception as e:
        print(f"  - ❌ Error in create_admin_user: {e}")
        return {"status": "Error", "message": str(e)}

def _send_whatsapp_confirmation(recipient_phone: str, message_body: str):
    # ... (function contents are unchanged) ...
    bridge_url = "http://localhost:8080/api/send"
    headers = {"Content-Type": "application/json"}
    formatted_phone = str(recipient_phone).strip()
    if not formatted_phone.startswith("91"):
        formatted_phone = "91" + formatted_phone
    payload = {
        "recipient": formatted_phone, 
        "message": message_body
    }
    print(f"\n--- [WhatsApp Notification] ---")
    print(f"  - Handing off to bridge for: {formatted_phone}")
    try:
        requests.post(bridge_url, headers=headers, data=json.dumps(payload), timeout=3)
        print("  - ✅ Hand-off to bridge was successful.")
    except requests.exceptions.Timeout:
        print("  - ✅ Hand-off successful (Go app is processing).")
    except requests.exceptions.RequestException as e:
        print(f"  - ❌ FAILED to send WhatsApp message. Could not connect to the bridge: {e}")
    except Exception as e:
        print(f"  - ❌ An unexpected error occurred: {e}")


@mcp.tool()
def verify_patient(phone:str) -> dict:
    # ... (function contents are unchanged) ...
    try:
        query = "SELECT patient_id, full_name FROM patients WHERE phone = %s"
        params = (phone,)
        result = _run_query(query, params, fetch='one')
        if result:
            return {"status": "Success", "patient_id": result['patient_id'], "full_name": result['full_name']}
        else:
            return {"status": "Failed", "message": "Could not find a patient with that name and date of birth."}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@mcp.tool()
def create_patient(full_name: str, date_of_birth: str, phone: str, gender: str = None, address: str = None) -> dict:
    # ... (function contents are unchanged) ...
    try:
        columns = ["full_name", "date_of_birth", "phone"]
        values_placeholder = ["%s", "%s", "%s"]
        params = [full_name, date_of_birth, phone]
        if gender:
            columns.append("gender")
            values_placeholder.append("%s")
            params.append(gender)
        if address:
            columns.append("address")
            values_placeholder.append("%s")
            params.append(address)
        query = f"INSERT INTO patients ({', '.join(columns)}) VALUES ({', '.join(values_placeholder)})"
        result = _run_query(query, tuple(params))
        new_patient_id = result.get('last_id')
        if new_patient_id:
            return {"status": "Success", "patient_id": new_patient_id, "full_name": full_name}
        else:
            return {"status": "Failed", "message": "Failed to create a new patient record."}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

# ... (check_availability and _get_available_time_slots are unchanged) ...
def _get_available_time_slots():
    slots = []
    for hour in range(10, 13): slots.extend([f"{hour:02}:00:00", f"{hour:02}:30:00"])
    for hour in range(14, 17): slots.extend([f"{hour:02}:00:00", f"{hour:02}:30:00"])
    return slots

@mcp.tool()
def check_availability(appointment_date: str, patient_id: int = None, appointment_start_time: str = None) -> dict:
    # ... (function contents are unchanged) ...
    try:
        start_date_obj = None
        if appointment_date.lower() == "today": start_date_obj = date.today()
        elif appointment_date.lower() == "tomorrow": start_date_obj = date.today() + timedelta(days=1)
        else: start_date_obj = datetime.strptime(appointment_date, "%Y-%m-%d").date()
        dentist_list_query = "SELECT dentist_id, name FROM dentists"
        all_dentists = _run_query(dentist_list_query)
        if not all_dentists: return {"status": "Failed", "message": "No dentists are configured."}
        dentist_map = {d['dentist_id']: d['name'] for d in all_dentists}
        dentist_search_order = []
        if patient_id:
            last_visit_query = "SELECT dentist_id FROM appointments WHERE patient_id = %s ORDER BY appointment_date DESC LIMIT 1"
            last_dentist = _run_query(last_visit_query, (patient_id,), fetch='one')
            if last_dentist:
                preferred_id = last_dentist['dentist_id']
                dentist_search_order.append(preferred_id)
                dentist_search_order.extend([d_id for d_id in dentist_map if d_id != preferred_id])
            else: dentist_search_order = list(dentist_map.keys())
        else: dentist_search_order = list(dentist_map.keys())
        now = datetime.now()
        current_date = start_date_obj
        end_date = current_date + timedelta(days=14)
        while current_date <= end_date:
            if current_date.weekday() < 6:
                booked_slots_q = "SELECT dentist_id, appointment_start_time FROM appointments WHERE appointment_date = %s AND status = 'Scheduled'"
                all_day_bookings = _run_query(booked_slots_q, (current_date,))
                booked_by_dentist = {}
                for booking in all_day_bookings:
                    d_id = booking['dentist_id']
                    if d_id not in booked_by_dentist: booked_by_dentist[d_id] = set()
                    booked_by_dentist[d_id].add(str(booking['appointment_start_time']))
                if appointment_start_time:
                    for dentist_id in dentist_search_order:
                        if appointment_start_time not in booked_by_dentist.get(dentist_id, set()):
                            return {"status": "Success", "earliest_slot": {"date": str(current_date), "time": appointment_start_time}, "dentist_id": dentist_id, "dentist_name": dentist_map[dentist_id]}
                else:
                    time_slots = _get_available_time_slots()
                    if current_date == now.date(): time_slots = [s for s in time_slots if datetime.strptime(s, "%H:%M:%S").time() > now.time()]
                    if time_slots:
                        for slot in time_slots:
                            for dentist_id in dentist_search_order:
                                if slot not in booked_by_dentist.get(dentist_id, set()):
                                    return {"status": "Success", "earliest_slot": {"date": str(current_date), "time": slot}, "dentist_id": dentist_id, "dentist_name": dentist_map[dentist_id]}
            current_date += timedelta(days=1)
        return {"status": "Failed", "message": "No available slots found."}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@mcp.tool()
def book_dentist_appointment(patient_id: int, dentist_id: int, appointment_date: str, appointment_start_time: str, reason: str = None) -> dict:
    # ... (function contents are unchanged) ...
    try:
        insert_query = "INSERT INTO appointments (dentist_id, patient_id, appointment_date, appointment_start_time, appointment_end_time, reason) VALUES (%s, %s, %s, %s, ADDTIME(%s, '00:30:00'), %s)"
        params = (dentist_id, patient_id, appointment_date, appointment_start_time, appointment_start_time, reason)
        insert_result = _run_query(insert_query, params)
        appointment_id = insert_result.get('last_id') if insert_result else None
        if not appointment_id:
            return {"status": "Failed", "message": "Failed to book the appointment in the database."}
        try:
            patient_details_query = "SELECT full_name, phone FROM patients WHERE patient_id = %s"
            patient_info = _run_query(patient_details_query, (patient_id,), fetch='one')
            if patient_info and patient_info.get('phone'):
                friendly_date = datetime.strptime(appointment_date, "%Y-%m-%d").strftime("%A, %B %d, %Y")
                friendly_time = datetime.strptime(appointment_start_time, "%H:%M:%S").strftime("%I:%M %p")
                message = (
                    f"Hello {patient_info['full_name']},\n\n"
                    f"Your dental appointment has been confirmed for *{friendly_date}* at *{friendly_time}*.\n\n"
                    f"We look forward to seeing you!"
                )
                _send_whatsapp_confirmation(patient_info['phone'], message)
            else:
                print("  - ⚠️ Could not find patient phone number for WhatsApp notification.")
        except Exception as e:
            print(f"  - ❌ An error occurred during the notification step: {e}")
        return {"status": "Success", "message": f"Appointment confirmed! Your appointment ID is {appointment_id}."}
    except Exception as e:
        print(f"  - ❌ MCP EXCEPTION in book_dentist_appointment: {e}")
        return {"status": "Error", "message": str(e)}
    
    
@mcp.tool()
def get_patient_appointments(phone: str) -> dict:
    # ... (function contents are unchanged) ...
    try:
        patient_query = "SELECT patient_id FROM patients WHERE phone = %s"
        patient_result = _run_query(patient_query, (phone,), fetch='one')
        if not patient_result:
            return {"status": "Failed", "message": "No patient found with this phone number."}
        patient_id = patient_result['patient_id']
        appointments_query = """
            SELECT appointment_date, appointment_start_time
            FROM appointments
            WHERE patient_id = %s AND status = 'Scheduled' AND appointment_date >= CURDATE()
            ORDER BY appointment_date, appointment_start_time
        """
        appointments = _run_query(appointments_query, (patient_id,), fetch='all')
        if not appointments:
            return {"status": "Failed", "message": "No upcoming appointments found for this patient."}
        appointment_list = [
            {
                "date": str(appt['appointment_date']),
                "time": str(appt['appointment_start_time'])
            } for appt in appointments
        ]
        return {"status": "Success", "appointments": appointment_list}
    except Exception as e:
        print(f"  - ❌ MCP EXCEPTION in get_patient_appointments: {e}")
        return {"status": "Error", "message": str(e)}

@mcp.tool()
def cancel_booking(phone: str, appointment_date: str) -> dict:
    # ... (function contents are unchanged) ...
    try:
        patient_query = "SELECT patient_id, full_name FROM patients WHERE phone = %s"
        patient_result = _run_query(patient_query, (phone,), fetch='one')
        if not patient_result:
            return {"status": "Failed", "message": "No patient found with this phone number."}
        patient_id = patient_result['patient_id']
        full_name = patient_result['full_name']
        update_query = """
            UPDATE appointments
            SET status = 'Cancelled'
            WHERE patient_id = %s AND appointment_date = %s AND status = 'Scheduled'
        """
        params = (patient_id, appointment_date)
        update_result = _run_query(update_query, params)
        if update_result and update_result.get('affected_rows', 0) > 0:
            try:
                friendly_date = datetime.strptime(appointment_date, "%Y-%m-%d").strftime("%A, %B %d, %Y")
                message = f"Hello {full_name},\n\nThis is a confirmation that your dental appointment for *{friendly_date}* has been successfully cancelled."
                _send_whatsapp_confirmation(phone, message)
            except Exception as e:
                print(f"  - ❌ Failed to send cancellation confirmation WhatsApp: {e}")
            return {"status": "Success", "message": "The appointment has been successfully cancelled."}
        else:
            return {"status": "Failed", "message": "Could not find a scheduled appointment on that date to cancel."}
    except Exception as e:
        print(f"  - ❌ MCP EXCEPTION in cancel_booking: {e}")
        return {"status": "Error", "message": str(e)}


# --- Dashboard Function (NOT a tool, called by bridge) ---
def get_dashboard_stats():
    # ... (function contents are unchanged) ...
    query = """
    SELECT
        (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE() AND status = 'Scheduled') AS todays_bookings,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURDATE() - INTERVAL 7 DAY AND status = 'Scheduled') AS weekly_bookings,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURDATE() - INTERVAL 30 DAY AND status = 'Scheduled') AS monthly_bookings,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURDATE() AND status = 'Scheduled') AS pending_jobs,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURDATE() - INTERVAL 30 DAY AND status = 'Cancelled') AS cancellations
    """
    default_stats = {
        "todays_bookings": 0, "weekly_bookings": 0, "monthly_bookings": 0,
        "pending_jobs": 0, "revenue_today": None, "revenue_month": None,
        "avg_turnaround_hr": None, "cancellations": 0
    }
    try:
        stats = _run_query(query, fetch='one')
        if not stats:
            return default_stats
        stats['avg_turnaround_hr'] = None 
        stats['revenue_today'] = None   
        stats['revenue_month'] = None 
        return stats
    except Exception as e:
        print(f"  - ❌ Error in get_dashboard_stats: {e}")
        return default_stats

def get_chart_data():
    # ... (function contents are unchanged) ...
    today = datetime.now().date()
    first_day_of_month = today.replace(day=1)
    last_day_num = calendar.monthrange(today.year, today.month)[1]
    last_day_of_month = today.replace(day=last_day_num)
    date_map = {}
    current_day = first_day_of_month
    while current_day <= last_day_of_month:
        date_map[current_day.strftime("%Y-%m-%d")] = 0
        current_day += timedelta(days=1)
    query = """
    SELECT 
        DATE(appointment_date) as date, 
        COUNT(*) as bookings
    FROM appointments
    WHERE 
        appointment_date BETWEEN %s AND %s 
        AND status = 'Scheduled'
    GROUP BY DATE(appointment_date)
    """
    params = (first_day_of_month, last_day_of_month) 
    try:
        results = _run_query(query, params, fetch='all') 
        if results:
            for row in results:
                date_str = str(row['date'])
                if date_str in date_map:
                    date_map[date_str] = row['bookings']
        chart_data_list = [
            {"date": date_str, "bookings": count} 
            for date_str, count in date_map.items()
        ]
        chart_data_list.sort(key=lambda x: x['date'])
        return {"data": chart_data_list}
    except Exception as e:
        print(f"  - ❌ Error in get_chart_data: {e}")
        return {"data": []} 

def get_todays_bookings_details():
    # ... (function contents are unchanged) ...
    query = """
        SELECT 
            p.full_name AS patient_name,
            d.name AS dentist_name,
            a.appointment_date,
            a.appointment_start_time,
            a.appointment_end_time
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN dentists d ON a.dentist_id = d.dentist_id
        WHERE 
            a.appointment_date = CURDATE()
            AND a.status = 'Scheduled'
        ORDER BY 
            a.appointment_start_time;
    """
    try:
        results = _run_query(query, fetch='all')
        if not results:
            return {"data": []}
        formatted_data = []
        for row in results:
            formatted_data.append({
                "patient_name": row['patient_name'],
                "dentist_name": row['dentist_name'],
                "date": str(row['appointment_date']),
                "time": str(row['appointment_start_time']),
                "end_time": str(row['appointment_end_time'])
            })
        return {"data": formatted_data}
    except Exception as e:
        print(f"  - ❌ Error in get_todays_bookings_details: {e}")
        return {"data": []}

@mcp.tool()
def get_monthly_breakdown_chart_data():
    # ... (function contents are unchanged) ...
    month_map = {}
    for i in range(1, 13):
        month_map[i] = {
            "month": calendar.month_name[i],
            "bookings": 0,
            "cancellations": 0
        }
    query = """
    SELECT
        MONTH(appointment_date) as month_num,
        COUNT(CASE WHEN status = 'Scheduled' THEN 1 ELSE NULL END) as bookings,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 ELSE NULL END) as cancellations
    FROM appointments
    WHERE
        YEAR(appointment_date) = YEAR(CURDATE())
    GROUP BY
        MONTH(appointment_date)
    ORDER BY
        month_num ASC;
    """
    try:
        results = _run_query(query, fetch='all')
        if results:
            for row in results:
                month_num = int(row['month_num'])
                if month_num in month_map:
                    month_map[month_num]['bookings'] = int(row['bookings'])
                    month_map[month_num]['cancellations'] = int(row['cancellations'])
        chart_data_list = list(month_map.values())
        return {"data": chart_data_list}
    except Exception as e:
        print(f"  - ❌ Error in get_monthly_breakdown_chart_data: {e}")
        return {"data": []} 



# --- UPDATED: __all__ must export the new user/auth functions ---
__all__ = [
    # Vapi Tools
    "verify_patient", "create_patient", "check_availability", 
    "book_dentist_appointment", "get_patient_appointments", "cancel_booking",
    "get_monthly_breakdown_chart_data",
    
    # Dashboard Functions
    "get_dashboard_stats", "get_chart_data",
    "get_todays_bookings_details",
    
    # NEW: Auth & User Functions
    "get_user_by_email", "create_admin_user", "verify_password"
]

if __name__ == "__main__":
    mcp.run("stdio")