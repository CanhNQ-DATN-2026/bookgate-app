"""
Seed script — runs on every startup but only inserts missing data.
Safe to run multiple times (idempotent).
"""
import os
import sys

# Allow running as `python -m scripts.seed` from /app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.book import Book


def seed():
    db = SessionLocal()
    try:
        _seed_admin(db)
        _seed_users(db)
        _seed_books(db)
        db.commit()
        print("[seed] Done.")
    except Exception as e:
        db.rollback()
        print(f"[seed] Error: {e}")
        raise
    finally:
        db.close()


def _seed_admin(db):
    existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not existing:
        admin = User(
            full_name=settings.ADMIN_FULL_NAME,
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        print(f"[seed] Created admin: {settings.ADMIN_EMAIL}")
    else:
        print(f"[seed] Admin already exists: {settings.ADMIN_EMAIL}")


def _seed_users(db):
    sample_users = [
        {"full_name": "Alice Johnson", "email": "alice@example.com", "password": "password123"},
        {"full_name": "Bob Smith", "email": "bob@example.com", "password": "password123"},
        {"full_name": "Carol White", "email": "carol@example.com", "password": "password123"},
    ]
    for u in sample_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                full_name=u["full_name"],
                email=u["email"],
                password_hash=get_password_hash(u["password"]),
                role=UserRole.USER,
            )
            db.add(user)
            print(f"[seed] Created user: {u['email']}")


def _seed_books(db):
    sample_books = [
        # ── Programming ──────────────────────────────────────────────
        {
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "category": "Programming",
            "description": "A handbook of agile software craftsmanship. Teaches how to write readable, maintainable code through practical examples and principles.",
            "isbn": "9780132350884",
            "published_year": 2008,
        },
        {
            "title": "The Pragmatic Programmer",
            "author": "David Thomas, Andrew Hunt",
            "category": "Programming",
            "description": "A collection of tips and best practices for software developers, covering everything from personal responsibility to career development.",
            "isbn": "9780135957059",
            "published_year": 2019,
        },
        {
            "title": "Code Complete",
            "author": "Steve McConnell",
            "category": "Programming",
            "description": "A comprehensive guide to software construction, covering design, coding, debugging, and testing with practical advice for developers.",
            "isbn": "9780735619678",
            "published_year": 2004,
        },
        {
            "title": "Introduction to Algorithms",
            "author": "Thomas H. Cormen, Charles E. Leiserson",
            "category": "Algorithms",
            "description": "The definitive textbook on algorithms and data structures, covering sorting, searching, graph algorithms, and complexity theory.",
            "isbn": "9780262033848",
            "published_year": 2022,
        },
        {
            "title": "Structure and Interpretation of Computer Programs",
            "author": "Harold Abelson, Gerald Jay Sussman",
            "category": "Programming",
            "description": "A foundational computer science textbook using Scheme to teach programming concepts like abstraction, recursion, and meta-linguistic abstraction.",
            "isbn": "9780262510875",
            "published_year": 1996,
        },
        # ── Python ────────────────────────────────────────────────────
        {
            "title": "Python Crash Course",
            "author": "Eric Matthes",
            "category": "Python",
            "description": "A hands-on, project-based introduction to programming with Python, covering basics through three real-world projects.",
            "isbn": "9781593279288",
            "published_year": 2019,
        },
        {
            "title": "Fluent Python",
            "author": "Luciano Ramalho",
            "category": "Python",
            "description": "Covers Python's best features and idioms to write effective, modern Python code. Essential for intermediate to advanced Python developers.",
            "isbn": "9781492056355",
            "published_year": 2022,
        },
        {
            "title": "Python for Data Analysis",
            "author": "Wes McKinney",
            "category": "Python",
            "description": "A practical guide to manipulating, processing, cleaning, and crunching data in Python using pandas, NumPy, and Jupyter.",
            "isbn": "9781098104030",
            "published_year": 2022,
        },
        # ── JavaScript & Web ──────────────────────────────────────────
        {
            "title": "You Don't Know JS",
            "author": "Kyle Simpson",
            "category": "JavaScript",
            "description": "A deep dive into the JavaScript language covering scope, closures, this, prototypes, types, and async patterns.",
            "isbn": "9781491904244",
            "published_year": 2015,
        },
        {
            "title": "JavaScript: The Good Parts",
            "author": "Douglas Crockford",
            "category": "JavaScript",
            "description": "Uncovers the beauty within JavaScript — a set of elegant and expressive features that make it suitable for professional programming.",
            "isbn": "9780596517748",
            "published_year": 2008,
        },
        {
            "title": "Eloquent JavaScript",
            "author": "Marijn Haverbeke",
            "category": "JavaScript",
            "description": "A modern introduction to programming with JavaScript, covering language fundamentals, browser APIs, and Node.js.",
            "isbn": "9781593279509",
            "published_year": 2018,
        },
        # ── Architecture & Systems ────────────────────────────────────
        {
            "title": "Designing Data-Intensive Applications",
            "author": "Martin Kleppmann",
            "category": "Architecture",
            "description": "The big ideas behind reliable, scalable, and maintainable systems — databases, distributed systems, and data processing at scale.",
            "isbn": "9781449373320",
            "published_year": 2017,
        },
        {
            "title": "Clean Architecture",
            "author": "Robert C. Martin",
            "category": "Architecture",
            "description": "A guide to building systems with proper separation of concerns, covering SOLID principles and component design for long-term maintainability.",
            "isbn": "9780134494166",
            "published_year": 2017,
        },
        {
            "title": "Domain-Driven Design",
            "author": "Eric Evans",
            "category": "Architecture",
            "description": "Tackling complexity in the heart of software by connecting implementation to an evolving model through strategic and tactical patterns.",
            "isbn": "9780321125217",
            "published_year": 2003,
        },
        {
            "title": "Building Microservices",
            "author": "Sam Newman",
            "category": "Architecture",
            "description": "A comprehensive guide to designing, building, and deploying microservices, covering service decomposition, communication, and deployment.",
            "isbn": "9781492034025",
            "published_year": 2021,
        },
        # ── DevOps & Infrastructure ───────────────────────────────────
        {
            "title": "The Phoenix Project",
            "author": "Gene Kim, Kevin Behr, George Spafford",
            "category": "DevOps",
            "description": "A novel about IT, DevOps, and helping your business win. Tells the story of a struggling IT department transforming through DevOps principles.",
            "isbn": "9781942788294",
            "published_year": 2018,
        },
        {
            "title": "The DevOps Handbook",
            "author": "Gene Kim, Patrick Debois, John Willis",
            "category": "DevOps",
            "description": "How to create world-class agility, reliability, and security in technology organizations through DevOps practices.",
            "isbn": "9781942788003",
            "published_year": 2016,
        },
        {
            "title": "Kubernetes in Action",
            "author": "Marko Luksa",
            "category": "DevOps",
            "description": "A comprehensive guide to deploying, managing, and scaling containerized applications with Kubernetes in production environments.",
            "isbn": "9781617293726",
            "published_year": 2017,
        },
        # ── Machine Learning & AI ─────────────────────────────────────
        {
            "title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
            "author": "Aurélien Géron",
            "category": "Machine Learning",
            "description": "Practical guide to machine learning using Python tools. Covers neural networks, deep learning, and production deployment.",
            "isbn": "9781098125974",
            "published_year": 2022,
        },
        {
            "title": "Deep Learning",
            "author": "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
            "category": "Machine Learning",
            "description": "The definitive textbook on deep learning, covering mathematical foundations through advanced topics like GANs and reinforcement learning.",
            "isbn": "9780262035613",
            "published_year": 2016,
        },
        {
            "title": "Pattern Recognition and Machine Learning",
            "author": "Christopher M. Bishop",
            "category": "Machine Learning",
            "description": "A comprehensive introduction to pattern recognition and machine learning from a Bayesian perspective.",
            "isbn": "9780387310732",
            "published_year": 2006,
        },
        # ── Database ──────────────────────────────────────────────────
        {
            "title": "Learning SQL",
            "author": "Alan Beaulieu",
            "category": "Database",
            "description": "Master SQL fundamentals for relational databases. Covers queries, joins, subqueries, indexes, and database design principles.",
            "isbn": "9781492057611",
            "published_year": 2020,
        },
        {
            "title": "PostgreSQL: Up and Running",
            "author": "Regina Obe, Leo Hsu",
            "category": "Database",
            "description": "A practical guide to PostgreSQL covering installation, data types, querying, performance tuning, and advanced features.",
            "isbn": "9781491963418",
            "published_year": 2017,
        },
        # ── Soft Skills & Career ──────────────────────────────────────
        {
            "title": "The Mythical Man-Month",
            "author": "Frederick P. Brooks Jr.",
            "category": "Software Engineering",
            "description": "Essays on software engineering, management, and the complexity of large systems. A classic that remains relevant decades later.",
            "isbn": "9780201835953",
            "published_year": 1995,
        },
        {
            "title": "Soft Skills: The Software Developer's Life Manual",
            "author": "John Sonmez",
            "category": "Career",
            "description": "A guide to career, productivity, finance, fitness, and relationships for software developers — the non-technical side of tech.",
            "isbn": "9781617292392",
            "published_year": 2014,
        },
        {
            "title": "Atomic Habits",
            "author": "James Clear",
            "category": "Productivity",
            "description": "A proven framework for improving every day. Teaches how tiny changes in behavior can compound into remarkable results over time.",
            "isbn": "9780735211292",
            "published_year": 2018,
        },
        # ── Security ──────────────────────────────────────────────────
        {
            "title": "The Web Application Hacker's Handbook",
            "author": "Dafydd Stuttard, Marcus Pinto",
            "category": "Security",
            "description": "A comprehensive guide to finding and exploiting security flaws in web applications, essential for security professionals.",
            "isbn": "9781118026472",
            "published_year": 2011,
        },
        {
            "title": "Hacking: The Art of Exploitation",
            "author": "Jon Erickson",
            "category": "Security",
            "description": "Introduces the fundamentals of C programming, assembly language, and exploitation techniques from a hacker's perspective.",
            "isbn": "9781593271442",
            "published_year": 2008,
        },
        # ── Classic CS ────────────────────────────────────────────────
        {
            "title": "The Art of Computer Programming",
            "author": "Donald E. Knuth",
            "category": "Computer Science",
            "description": "The seminal multi-volume work covering fundamental algorithms and data structures. A must-have reference for serious computer scientists.",
            "isbn": "9780201853926",
            "published_year": 2011,
        },
        {
            "title": "Grokking Algorithms",
            "author": "Aditya Bhargava",
            "category": "Algorithms",
            "description": "An illustrated guide to algorithms for programmers. Covers search, sort, graph algorithms, and dynamic programming with visual examples.",
            "isbn": "9781617292231",
            "published_year": 2016,
        },
    ]
    for b in sample_books:
        existing = db.query(Book).filter(Book.isbn == b["isbn"]).first()
        if not existing:
            book = Book(**b)
            db.add(book)
            print(f"[seed] Created book: {b['title']}")


if __name__ == "__main__":
    seed()
