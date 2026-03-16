import jesse
from jesse.routes import router
import os

print(f"Jesse version: {jesse.__version__ if hasattr(jesse, '__version__') else 'Unknown'}")
print(f"Current Directory: {os.getcwd()}")
print(f"Config exists: {os.path.exists('config.py')}")
print(f"Routes exists: {os.path.exists('routes.py')}")
print(f"Strategies exists: {os.path.exists('strategies')}")
print(f"Storage exists: {os.path.exists('storage')}")

try:
    from jesse.services.api import api
    print("Jesse API service imported successfully")
except Exception as e:
    print(f"Jesse API import failed: {e}")

# Check if we can see the commands via click
try:
    from jesse.cli import cli
    print("Jesse CLI object found")
    print(f"Available commands: {list(cli.commands.keys())}")
except Exception as e:
    print(f"Could not inspect Jesse CLI: {e}")
