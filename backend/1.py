import mysql.connector
from mysql.connector import errorcode
import bcrypt
import getpass # Used for securely getting a password

def create_user():
    """
    Prompts for user details, hashes the password using bcrypt,
    and inserts the new user directly into the database.
    """
    
    # --- 1. Get User Input ---
    print("--- Create New Admin User ---")
    user_name = input("Enter username: ").strip()
    user_email = input("Enter email: ").strip()
    
    # Securely get the password without showing it on the screen
    try:
        # Use getpass for better security (hides input)
        password_plain = getpass.getpass("Enter password: ").strip()
        password_confirm = getpass.getpass("Confirm password: ").strip()
    except Exception as err:
        print(f'\n❌ Error getting password: {err}')
        return

    # Basic input validation
    if not all([user_name, user_email, password_plain, password_confirm]):
        print("\n❌ Username, email, and passwords cannot be empty.")
        return
        
    if password_plain != password_confirm:
        print("\n❌ Passwords do not match.")
        return

    # --- 2. Hash the Password with bcrypt ---
    try:
        print("\n⏳ Hashing password...")
        # Encode the plain-text password to bytes (required by bcrypt)
        password_bytes = password_plain.encode('utf-8')
        
        # Generate a salt and hash the password
        # gensalt() automatically uses a good number of rounds
        salt = bcrypt.gensalt()
        password_hash_bytes = bcrypt.hashpw(password_bytes, salt)
        
        # Decode the hash back to a string to store it in the database
        password_hash_str = password_hash_bytes.decode('utf-8')
        print("   Password hashed successfully.")
        
    except Exception as e:
        print(f"\n❌ Error during password hashing: {e}")
        return

    # --- 3. Database Connection and Insertion ---
    conn = None
    cursor = None
    
    # --- !! IMPORTANT: Use your actual database credentials here !! ---
    DB_CONFIG = {
        'host': 'sales-advisor.ckbouw8iick1.us-east-1.rds.amazonaws.com',
        'user': 'admin',
        'password': 'Vapi_009',
        'database': 'dentist_appointments'
    }
    # -------------------------------------------------------------------

    try:
        print("\n⏳ Connecting to database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("   Connected.")

        # Define the SQL query using placeholders (%s) for security
        query = (
            "INSERT INTO users "
            "(user_name, user_email, password_hash) "
            "VALUES (%s, %s, %s)"
        )

        # Define the data to insert in a tuple (order must match placeholders)
        data_to_insert = (user_name, user_email, password_hash_str)

        print("\n⏳ Inserting user into database...")
        # Execute the query with the data
        cursor.execute(query, data_to_insert)

        # Commit the transaction to make the changes permanent
        conn.commit()
        
        # Get the ID of the newly inserted row
        new_user_id = cursor.lastrowid

        print(f"\n✅ Successfully created user:")
        print(f"   ID: {new_user_id}")
        print(f"   Username: {user_name}")
        print(f"   Email: {user_email}")
        # DO NOT print the hash or password

    except mysql.connector.Error as err:
        # If an error occurs, roll back any changes made during the transaction
        if conn:
            conn.rollback()
            
        if err.errno == errorcode.ER_DUP_ENTRY:
            # Specific error for duplicate username or email (if they are UNIQUE keys)
            print(f"\n❌ Database Error: A user with that username or email already exists.")
        else:
            # General database error
            print(f"\n❌ Database Error: {err}")
    
    except Exception as e:
        # Catch any other unexpected errors
        print(f"\n❌ An unexpected error occurred: {e}")
        if conn:
            conn.rollback() # Rollback on unexpected errors too

    finally:
        # Ensure the connection and cursor are always closed,
        # whether the operation succeeded or failed.
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
            # print("\nMySQL connection is closed.")

# --- Run the function when the script is executed directly ---
if __name__ == "__main__":
    create_user()
