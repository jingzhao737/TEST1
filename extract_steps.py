import json
import os

log_file = r'C:\Users\jackchen\.gemini\antigravity\brain\9a7e12a1-336c-4270-87e5-3e0923309e6a\.system_generated\logs\transcript.jsonl'
output_file = r'C:\Users\jackchen\lobsterai\project\portfolio-v1\reconstruction_steps.txt'

with open(log_file, 'r', encoding='utf-8') as f, open(output_file, 'w', encoding='utf-8') as out:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step > 614:
                break
            
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    name = tc['name']
                    args = tc.get('args', {})
                    if name in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                        file_path = args.get('TargetFile', '')
                        filename = os.path.basename(file_path)
                        
                        out.write(f"--- STEP {step} : {name} on {filename} ---\n")
                        if name == 'write_to_file':
                            out.write(f"Created file with length {len(args.get('CodeContent', ''))}\n")
                            if filename == 'hover-preview.js' or filename == 'premium-interactions.js':
                                out.write(args.get('CodeContent', '')[:500] + "\n...\n")
                        elif name == 'replace_file_content':
                            out.write(f"Instruction: {args.get('Instruction', '')}\n")
                            out.write(f"Target: {args.get('TargetContent', '')}\n")
                            out.write(f"Replacement: {args.get('ReplacementContent', '')}\n")
                        elif name == 'multi_replace_file_content':
                            out.write(f"Instruction: {args.get('Instruction', '')}\n")
                            chunks = args.get('ReplacementChunks', [])
                            for i, chunk in enumerate(chunks):
                                out.write(f" Chunk {i+1} Target:\n{chunk.get('TargetContent', '')}\n")
                                out.write(f" Chunk {i+1} Replace:\n{chunk.get('ReplacementContent', '')}\n")
                        out.write("\n")
        except Exception as e:
            pass
