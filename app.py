
# app.py
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('home'))  # Updated: Ensure logout redirects to home
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

        if User.query.filter_by(username=username, email=email).first():  # Updated: Check if both username and email exist in database
            flash('Username and email already registered. Please log in.', 'info')
            return redirect(url_for('login'))

        if User.query.filter_by(username=username).first():
            flash('Username already exists!', 'error')
            return redirect(url_for('register'))

        if User.query.filter_by(email=email).first():
            flash('Email already exists!', 'error')
            return redirect(url_for('register'))

        new_user = User(username=username, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        flash('Registration successful! Redirecting to home page.', 'success')  # Updated: Redirect to home after successful registration
        session['user_id'] = new_user.id
        return redirect(url_for('home'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()

        if not user:
            flash('Email not found. Please register.', 'error')
            return redirect(url_for('login'))

        if not check_password_hash(user.password, password):
            flash('Incorrect password. Please try again.', 'error')
            return redirect(url_for('login'))

        session['user_id'] = user.id
        flash('Login successful! Redirecting to home page.', 'success')  # Updated: Redirect to home after successful login
        return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    if 'user_id' in session:
        session.pop('user_id', None)
        flash('You have been logged out.', 'success')
        return redirect(url_for('home'))
    return redirect(url_for('index'))

@app.route('/confirm_logout', methods=['POST'])
def confirm_logout():
    if 'user_id' in session:
        session.pop('user_id', None)
        flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/home')
def home():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('home.html')

@app.route('/analyze')
def analyze():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('analyze.html')

@app.route('/cricketknowledge')
def cricketknowledge():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('cricketknowledge.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)