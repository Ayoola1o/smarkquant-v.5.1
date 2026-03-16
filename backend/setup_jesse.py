import os

folders = [
    'storage',
    'storage/logs',
    'storage/temp',
    'storage/csv',
    'storage/json',
    'storage/optimization',
    'storage/backtests',
    'strategies'
]

for folder in folders:
    if not os.path.exists(folder):
        os.makedirs(folder)
        print(f"Created {folder}")
    else:
        print(f"Exists {folder}")

# Create an empty routes.py if it doesn't exist
if not os.path.exists('routes.py'):
    with open('routes.py', 'w') as f:
        f.write("routes = []\n")
    print("Created routes.py")
else:
    print("Exists routes.py")

# Create an empty .gitignore if it doesn't exist
if not os.path.exists('.gitignore'):
    with open('.gitignore', 'w') as f:
        f.write("storage/*\n!storage/.gitkeep\n")
    print("Created .gitignore")
