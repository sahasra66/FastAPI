import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Define Product model here for Vercel compatibility
class Product(BaseModel):
    id: int
    name: str
    description: str
    quantity: int
    price: float

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# Update CORS to allow Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
        "*"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

@app.get("/")
def greet():
    return {
        "message": "Welcome to FastAPI Course",
        "endpoints": {
            "products": "/products",
            "product_by_id": "/product/{id}",
            "add_product": "POST /products",
            "update_product": "PUT /products/{id}",
            "delete_product": "DELETE /products/{id}"
        }
    }

@app.get("/products")
def getAllProducts():
    try:
        response = supabase.table("products").select('*').execute()
        return response.data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/product/{id}")
def get_product_by_id(id: int):
    try:
        response = supabase.table("products").select('*').eq("id", id).execute()
        if response.data:
            return response.data[0]
        return JSONResponse(status_code=404, content={"error": "Product not found"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/products")
def add_product(product: Product):
    try:
        product_dict = product.dict()
        response = supabase.table("products").insert(product_dict).execute()
        return response.data[0] if response.data else product_dict
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.put("/products/{id}")
def update_product(id: int, product: Product):
    try:
        product_dict = product.dict()
        response = supabase.table("products").update(product_dict).eq("id", id).execute()
        if response.data:
            return {"message": "Product updated successfully", "data": response.data[0]}
        return JSONResponse(status_code=404, content={"error": "Product not found"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/products/{id}")
def delete_product(id: int):
    try:
        response = supabase.table("products").delete().eq("id", id).execute()
        if response.data:
            return {"message": "Product deleted successfully"}
        return JSONResponse(status_code=404, content={"error": "Product not found"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
