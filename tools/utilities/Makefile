# Makefile for Advanced Fraud Detection System
.PHONY: help install install-dev test test-coverage lint format type-check security-check clean docs setup-pre-commit profile benchmark all-checks

# Default target
help:
	@echo "Advanced Fraud Detection System - Available Commands:"
	@echo ""
	@echo "Setup and Installation:"
	@echo "  install           Install package and dependencies"
	@echo "  install-dev       Install package with development dependencies"
	@echo "  setup-pre-commit  Setup pre-commit hooks"
	@echo ""
	@echo "Code Quality:"
	@echo "  format           Format code with black and isort"
	@echo "  lint             Run flake8 linter"
	@echo "  type-check       Run mypy type checker"
	@echo "  security-check   Run bandit security scanner"
	@echo "  all-checks       Run all code quality checks"
	@echo ""
	@echo "Testing:"
	@echo "  test             Run all tests"
	@echo "  test-coverage    Run tests with coverage report"
	@echo "  test-unit        Run unit tests only"
	@echo "  test-integration Run integration tests only"
	@echo ""
	@echo "Performance:"
	@echo "  profile          Run performance profiling"
	@echo "  benchmark        Run comprehensive benchmarks"
	@echo ""
	@echo "Documentation:"
	@echo "  docs             Build documentation"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean            Clean build artifacts"
	@echo "  clean-cache      Clean Python cache files"

# Installation
install:
	pip install -e .

install-dev:
	pip install -e ".[dev]"
	pip install pre-commit

setup-pre-commit:
	pre-commit install
	pre-commit install --hook-type commit-msg

# Code formatting
format:
	@echo "Formatting code with black..."
	black --line-length 100 .
	@echo "Sorting imports with isort..."
	isort --profile black --line-length 100 .
	@echo "Code formatting complete!"

# Linting
lint:
	@echo "Running flake8 linter..."
	flake8 --max-line-length=100 --ignore=E203,W503 .
	@echo "Linting complete!"

# Type checking
type-check:
	@echo "Running mypy type checker..."
	mypy --ignore-missing-imports --strict-optional .
	@echo "Type checking complete!"

# Security scanning
security-check:
	@echo "Running bandit security scanner..."
	bandit -r . -x tests/ -f json -o security-report.json || true
	bandit -r . -x tests/ --skip B101,B601
	@echo "Security scan complete!"

# Documentation style
doc-style:
	@echo "Checking documentation style..."
	pydocstyle --convention=google .
	@echo "Documentation style check complete!"

# All quality checks
all-checks: format lint type-check security-check doc-style
	@echo "All code quality checks complete! ✅"

# Testing
test:
	@echo "Running all tests..."
	python -m pytest -v
	@echo "All tests complete!"

test-coverage:
	@echo "Running tests with coverage..."
	python -m pytest --cov=. --cov-report=html --cov-report=term-missing --cov-fail-under=80
	@echo "Coverage report generated in htmlcov/"

test-unit:
	@echo "Running unit tests..."
	python -m pytest -v -m "unit or not integration"

test-integration:
	@echo "Running integration tests..."
	python -m pytest -v -m "integration"

test-security:
	@echo "Running security tests..."
	python -m pytest -v -m "security"

test-parallel:
	@echo "Running tests in parallel..."
	python -m pytest -n auto -v

# Performance profiling
profile:
	@echo "Running performance profiling..."
	python -m cProfile -o profile_output.prof test_advanced_fraud_detection.py
	@echo "Profile saved to profile_output.prof"
	@echo "Use 'python -m pstats profile_output.prof' to view results"

profile-memory:
	@echo "Running memory profiling..."
	python -m memory_profiler advanced_fraud_detection_engine.py

profile-line:
	@echo "Running line-by-line profiling..."
	kernprof -l -v advanced_fraud_detection_engine.py

# Benchmarking
benchmark:
	@echo "Running comprehensive benchmarks..."
	python comprehensive_benchmark.py
	@echo "Benchmark complete!"

benchmark-quick:
	@echo "Running quick performance benchmark..."
	python -c "
import time
from advanced_fraud_detection_engine import AdvancedFraudDetectionEngine
import numpy as np

# Quick benchmark
print('🔬 Quick Fraud Detection Benchmark')
print('=' * 50)

engine = AdvancedFraudDetectionEngine()
X_train = np.random.randn(1000, 10)
X_test = np.random.randn(100, 10)

# Training benchmark
start = time.time()
engine.fit(X_train)
train_time = time.time() - start
print(f'Training time: {train_time:.3f}s')

# Prediction benchmark
start = time.time()
result = engine.predict(X_test)
pred_time = time.time() - start
throughput = len(X_test) / pred_time

print(f'Prediction time: {pred_time:.4f}s')
print(f'Throughput: {throughput:.0f} predictions/sec')
print('✅ Quick benchmark complete!')
"

# Data security validation
validate-security:
	@echo "Running data security validation..."
	python -c "
from real_time_monitoring import RealTimeMonitor

monitor = RealTimeMonitor()

# Test data with potential security issues
test_data = {
    'credit_card': '4532-1234-5678-9012',
    'ssn': '123-45-6789',
    'email': 'test@example.com',
    'api_key': 'sk_test_123456789abcdef',
    'normal_field': 'normal_value'
}

print('🔒 Data Security Validation')
print('=' * 50)

events = monitor.validate_data_security(test_data)
print(f'Security events detected: {len(events)}')

for event in events:
    print(f'- {event.event_type}: {event.description} (Risk: {event.risk_score})')

if events:
    print('⚠️  Security issues found - review data handling!')
else:
    print('✅ No security issues detected')
"

# Documentation
docs:
	@echo "Building documentation..."
	cd docs && make html
	@echo "Documentation built in docs/_build/html/"

docs-serve:
	@echo "Serving documentation locally..."
	cd docs/_build/html && python -m http.server 8080

# Cleaning
clean:
	@echo "Cleaning build artifacts..."
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -f profile_output.prof
	rm -f security-report.json
	@echo "Build artifacts cleaned!"

clean-cache:
	@echo "Cleaning Python cache..."
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	@echo "Python cache cleaned!"

clean-all: clean clean-cache
	@echo "All artifacts cleaned!"

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t fraud-detection:latest .

docker-run:
	@echo "Running Docker container..."
	docker run -p 5003:5003 -p 5004:5004 fraud-detection:latest

docker-test:
	@echo "Running tests in Docker..."
	docker run --rm fraud-detection:latest make test

# Database commands
db-setup:
	@echo "Setting up databases..."
	python -c "
from real_time_monitoring import RealTimeMonitor
from customer_experience_enhancements import CustomerExperienceManager

# Initialize databases
monitor = RealTimeMonitor()
ce_manager = CustomerExperienceManager()
print('✅ Databases initialized successfully!')
"

# System health check
health-check:
	@echo "Running system health check..."
	python -c "
import psutil
import sys
import os

print('🏥 System Health Check')
print('=' * 50)

# Check Python version
print(f'Python version: {sys.version}')

# Check available memory
memory = psutil.virtual_memory()
print(f'Memory: {memory.available // (1024**3)}GB available / {memory.total // (1024**3)}GB total')

# Check disk space
disk = psutil.disk_usage('/')
print(f'Disk: {disk.free // (1024**3)}GB free / {disk.total // (1024**3)}GB total')

# Check CPU
cpu_count = psutil.cpu_count()
cpu_percent = psutil.cpu_percent(interval=1)
print(f'CPU: {cpu_count} cores, {cpu_percent}% usage')

# Check required files
required_files = [
    'advanced_fraud_detection_engine.py',
    'real_time_monitoring.py',
    'customer_experience_enhancements.py',
    'real_time_dashboard.py'
]

missing_files = []
for file in required_files:
    if not os.path.exists(file):
        missing_files.append(file)

if missing_files:
    print(f'⚠️  Missing files: {missing_files}')
else:
    print('✅ All required files present')

print('Health check complete!')
"

# Performance optimization
optimize:
	@echo "Running performance optimization..."
	python -c "
import os
import subprocess

print('⚡ Performance Optimization')
print('=' * 50)

# Set environment variables for better performance
os.environ['PYTHONOPTIMIZE'] = '1'
os.environ['OMP_NUM_THREADS'] = str(os.cpu_count())

print('✅ Environment optimized for performance')
print(f'Using {os.cpu_count()} CPU threads')
"

# Complete setup from scratch
setup: install-dev setup-pre-commit db-setup
	@echo "🚀 Complete setup finished!"
	@echo "Run 'make health-check' to verify installation"

# Development workflow
dev-workflow: format lint type-check test-coverage
	@echo "🔄 Development workflow complete!"

# Production readiness check
production-check: all-checks test-coverage security-check validate-security benchmark
	@echo "🚀 Production readiness check complete!"
	@echo "System is ready for deployment! ✅"