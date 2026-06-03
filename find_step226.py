import json

log_file = r'C:\Users\jackchen\.gemini\antigravity\brain\9a7e12a1-336c-4270-87e5-3e0923309e6a\.system_generated\logs\transcript.jsonl'
with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step != 226:
                continue
            
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    name = tc['name']
                    args = tc.get('args', {})
                    if type(args) == str:
                        try:
                            args = json.loads(args)
                        except:
                            pass
                    chunks = args.get('ReplacementChunks', [])
                    if type(chunks) == str:
                        try:
                            chunks = json.loads(chunks)
                        except:
                            pass
                    for i, chunk in enumerate(chunks):
                        tc_str = str(chunk.get('TargetContent', ''))[:300]
                        rc_str = str(chunk.get('ReplacementContent', ''))[:300]
                        print(f'Chunk {i}:')
                        print(f'  TARGET: {tc_str}')
                        print(f'  REPLACEMENT: {rc_str}')
                        print()
        except Exception as e:
            print(f'Error: {e}')
