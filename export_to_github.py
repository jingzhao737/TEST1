import os
import shutil

src_dir = r'C:\Users\jackchen\lobsterai\project\portfolio-v1'
dest_dir = r'C:\Users\jackchen\Desktop\portfolio-github-upload'

# Exclude list for GitHub upload
exclude_dirs = {'node_modules', '.git', 'dist'}
exclude_files = {'do_backup.py', 'replace_fonts.py', 'fix_fallback.py', 'restore_backup.py'}

if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)

os.makedirs(dest_dir)

for root, dirs, files in os.walk(src_dir):
    # Remove excluded directories from traversal
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    
    for file in files:
        if file in exclude_files:
            continue
        
        src_path = os.path.join(root, file)
        rel_path = os.path.relpath(src_path, src_dir)
        dest_path = os.path.join(dest_dir, rel_path)
        
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(src_path, dest_path)

print(f"Project successfully exported to: {dest_dir}")
