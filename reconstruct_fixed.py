import json
import os
import shutil

log_file = r'C:\Users\jackchen\.gemini\antigravity\brain\9a7e12a1-336c-4270-87e5-3e0923309e6a\.system_generated\logs\transcript.jsonl'
project_dir = r'C:\Users\jackchen\lobsterai\project\portfolio-v1'
backup_base = r'C:\Users\jackchen\lobsterai\project\portfolio-v1-backups'

def backup_step(step_idx):
    step_dir = os.path.join(backup_base, f'step_{step_idx}')
    os.makedirs(step_dir, exist_ok=True)
    for root, dirs, files in os.walk(project_dir):
        if 'node_modules' in root or '.git' in root or 'images' in root or 'videos' in root or 'sound' in root or 'Font' in root:
            continue
        for f in files:
            if f.endswith('.html') or f.endswith('.css') or f.endswith('.js') or f.endswith('.json'):
                src = os.path.join(root, f)
                rel = os.path.relpath(src, project_dir)
                dst = os.path.join(step_dir, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)

os.makedirs(backup_base, exist_ok=True)
backup_step(0)

applied_count = 0
with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step > 614:
                break
            
            if 'tool_calls' in data:
                made_change = False
                for tc in data['tool_calls']:
                    name = tc['name']
                    args = tc.get('args', {})
                    if type(args) == str:
                        try:
                            args = json.loads(args)
                        except:
                            pass
                    
                    file_path = args.get('TargetFile', '')
                    if not file_path:
                        continue
                        
                    file_path = file_path.strip('"')
                    filename = os.path.basename(file_path)
                    target_path = os.path.join(project_dir, filename)
                    
                    if filename in ['premium-interactions.js', 'hover-preview.js', 'stars.js', 'hanging-circles.js', 'nav-waveform.js']:
                        if not os.path.exists(target_path):
                            target_path = os.path.join(project_dir, 'js', 'modules', filename)
                            if not os.path.exists(target_path) and filename == 'premium-interactions.js':
                                target_path = os.path.join(project_dir, filename)
                    
                    if name == 'write_to_file':
                        code = args.get('CodeContent', '')
                        if not os.path.exists(os.path.dirname(target_path)):
                            os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        with open(target_path, 'w', encoding='utf-8') as out:
                            out.write(code)
                        made_change = True
                        print(f"Step {step}: Wrote {filename}")
                        
                    elif name == 'replace_file_content':
                        if os.path.exists(target_path):
                            with open(target_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                            target = args.get('TargetContent', '')
                            replacement = args.get('ReplacementContent', '')
                            if target in content:
                                content = content.replace(target, replacement, 1)
                                with open(target_path, 'w', encoding='utf-8') as out:
                                    out.write(content)
                                made_change = True
                                print(f"Step {step}: Replaced in {filename}")
                            else:
                                print(f"Step {step}: Target not found in {filename}!")
                                
                    elif name == 'multi_replace_file_content':
                        if os.path.exists(target_path):
                            with open(target_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                            chunks = args.get('ReplacementChunks', [])
                            if type(chunks) == str:
                                chunks = json.loads(chunks)
                            
                            success = True
                            for chunk in chunks:
                                target = chunk.get('TargetContent', '')
                                replacement = chunk.get('ReplacementContent', '')
                                if target in content:
                                    content = content.replace(target, replacement, 1)
                                else:
                                    success = False
                                    print(f"Step {step}: Multi-replace target not found in {filename}!")
                            if success:
                                with open(target_path, 'w', encoding='utf-8') as out:
                                    out.write(content)
                                made_change = True
                                print(f"Step {step}: Multi-replaced in {filename}")

                if made_change:
                    backup_step(step)
                    applied_count += 1
                    
        except Exception as e:
            import traceback
            traceback.print_exc()

print(f"\nApplied {applied_count} modification steps successfully.")
