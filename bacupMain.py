import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from models import Product

from supabase import create_client,Client

from dotenv import load_dotenv

import database_models
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL,SUPABASE_KEY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)


@app.get("/")
def greet():
    return "Welcome to Fast API Course"
products = [
    # below 2 lines format if we are using constructor in models
    # Product(1,"Phone","Budget phone",10,40000),
    # Product(2,"Laptop","Budget laptop",1,80000)
    Product(id=1, name="Phone", description="A smartphone", price=699.99, quantity=50),
    Product(id=2, name="Laptop", description="A powerful laptop", price= 999.99, quantity=30),
    Product(id=5, name="Pen", description="A Blue ink pen", price=1.99, quantity=100),
    Product(id=6, name="Table", description="A wooden table", price=199.99, quantity=20)
]

def init_db():
    try:
        response = supabase.table("products").select("id").execute()

        if not response.data or len(response.data) == 0:
            default_products = [
                {"id": 1, "name": "Phone", "description": "A smartphone", "price": 699.99, "quantity": 50},
                {"id": 2, "name": "Laptop", "description": "A powerful laptop", "price": 999.99, "quantity": 30},
                {"id": 5, "name": "Pen", "description": "A Blue ink pen", "price": 1.99, "quantity": 100},
                {"id": 6, "name": "Table", "description": "A wooden table", "price": 199.99, "quantity": 20},
            ]

            for product in default_products:
                supabase.table("products").insert(product).execute()
            print("Default products added to database")
        else:
            print(f"Database already has {len(response.data)} products")
    except Exception as e:
        print(f"Error initializing database: {e}")


@app.get("/products")
def getAllProducts():   
    try:
        response = supabase.table("products").select('*').execute()
        return response.data
    except Exception as e:
        return {"error":str(e)}




@app.get("/product/{id}")
def get_product_by_id(id: int):
    for product in products:
        if product.id == id:
            return product
    return "Product Not Found"

@app.post("/product")
def add_product(product : Product):
    products.append(product)
    return product


@app.put("/product")
def update_product(id:int,product:Product):
    for i in range(len(products)):
       if  products[i].id == id:
           products[i] = product
           return "Product added successfully" 
    return "All done"



@app.delete("/product")
def delete_product(id: int):
    for i in range(len(products)):
        if products[i].id ==id:
            del products[i]
            return "Product deleted"
    return "product not found"


