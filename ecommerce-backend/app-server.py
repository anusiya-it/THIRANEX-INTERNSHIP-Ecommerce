import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

# 2. Initialize Flask and CORS (Allow React frontend requests)
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 3. Configure Database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- DATABASE MODELS ---
class User(db.Model):
    __tablename__ = 'user'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(20), default='user')

class Product(db.Model):
    __tablename__ = 'product'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50), default='General')

class Order(db.Model):
    __tablename__ = 'order'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='Pending')

# --- API ROUTES ---
@app.route("/", methods=["GET"])
def home():
    return "Hello! Your e-commerce backend is awake and connected!"

@app.route("/add-user", methods=["POST"])
def add_user():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email"):
        return jsonify({"error": "Name and email are required!"}), 400
    
    new_user = User(
        name=data["name"], 
        email=data["email"], 
        role=data.get("role", "user")
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created!", "user_id": new_user.id}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email"):
        return jsonify({"error": "Email is required!"}), 400

    email = data["email"].strip().lower()
    
    # Check if user already exists
    user = User.query.filter_by(email=email).first()
    
    # If user doesn't exist, automatically register them as a public user
    if not user:
        role = 'admin' if email == 'anusiya.it@gmail.com' else 'user'
        name = email.split('@')[0]  # Auto-generate name from email prefix
        
        user = User(name=name, email=email, role=role)
        db.session.add(user)
        db.session.commit()

    return jsonify({
        "message": "Login successful!",
        "user_id": user.id,
        "name": user.name,
        "role": user.role
    }), 200

@app.route("/add-product", methods=["POST"])
def add_new_product():
    data = request.get_json()

    if not data or not data.get("name") or not data.get("price"):
        return jsonify({"error": "Product name and price are required!"}), 400

    new_item = Product(
        name=data["name"],
        price=data["price"],
        stock=data.get("stock", 0),
        category=data.get("category", "General")
    )

    db.session.add(new_item)
    db.session.commit()

    return jsonify({
        "message": "Product added successfully!",
        "product_id": new_item.id
    }), 201

@app.route("/products", methods=["GET"])
def get_all_products():
    all_products = Product.query.all()

    product_list = []
    for item in all_products:
        product_list.append({
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "stock": item.stock,
            "category": item.category
        })

    return jsonify(product_list), 200

@app.route("/orders", methods=["GET"])
def get_all_orders():
    all_orders = Order.query.all()
    order_list = []
    for order in all_orders:
        order_list.append({
            "id": order.id,
            "user_id": order.user_id,
            "product_id": order.product_id,
            "quantity": order.quantity,
            "status": order.status
        })
    return jsonify(order_list), 200

@app.route("/orders", methods=["POST"])
def create_order():
    data = request.get_json()

    if not data or not data.get("user_id") or not data.get("product_id") or not data.get("quantity"):
        return jsonify({"error": "user_id, product_id, and quantity are required!"}), 400

    new_order = Order(
        user_id=data["user_id"],
        product_id=data["product_id"],
        quantity=data["quantity"],
        status="Pending"
    )

    db.session.add(new_order)
    db.session.commit()

    return jsonify({
        "message": "Order placed successfully!",
        "order_id": new_order.id,
        "status": new_order.status
    }), 201

# --- RUN APPLICATION ---
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Magic complete: Tables created in Neon Database!")
    app.run(debug=True)