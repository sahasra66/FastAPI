from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_DB_URL = os.getenv("DATABASE_URL")

if not SUPABASE_DB_URL:
    raise ValueError("DATABASE_URL environment variable not set. Please add your Supabase connection string.")

engine = create_engine(
    SUPABASE_DB_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()

session = Session
